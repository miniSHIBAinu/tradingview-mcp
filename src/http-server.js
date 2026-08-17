import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createChartReaderServer } from './chart-reader-server.js';
import { CDP_HOST, CDP_PORT } from './connection.js';

/**
 * Validate incoming request authorization against configured token.
 * Supports "Authorization: Bearer <token>" and "x-api-key: <token>".
 */
export function validateAuth(req, expectedToken) {
  if (!expectedToken) return true;
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'] || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() === expectedToken.trim();
  }
  return authHeader.trim() === expectedToken.trim();
}

/**
 * Creates and configures the Streamable HTTP MCP server.
 */
export function createMcpHttpServer(options = {}) {
  const authToken = options.authToken ?? (process.env.TDV_MCP_AUTH_TOKEN || process.env.MCP_AUTH_TOKEN || process.env.AUTH_TOKEN);
  const requireAuth = options.requireAuth ?? (process.env.NODE_ENV === 'production');
  const serverFactory = options.serverFactory || createChartReaderServer;

  if (requireAuth && !authToken) {
    throw new Error('TDV_MCP_AUTH_TOKEN is required in production environment');
  }

  const sessions = new Map();

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');

    // Health check endpoint (always accessible for monitoring / reverse proxy checks)
    if (url.pathname === '/health' || url.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'tdv-mcp-http',
        uptime: process.uptime(),
        active_sessions: sessions.size,
        cdp_target: `${CDP_HOST}:${CDP_PORT}`,
      }));
      return;
    }

    // Only allow /mcp, /sse, or root / for MCP requests
    if (url.pathname !== '/mcp' && url.pathname !== '/sse' && url.pathname !== '/') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    // Authentication check before any MCP transport processing
    if (!validateAuth(req, authToken)) {
      res.writeHead(401, {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="tdv-mcp"',
      });
      res.end(JSON.stringify({ error: 'Unauthorized: missing or invalid authentication token' }));
      return;
    }

    const sessionId = req.headers['mcp-session-id'];

    if (sessionId) {
      const session = sessions.get(sessionId);
      if (!session) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Session not found or expired' }));
        return;
      }
      session.lastActiveAt = Date.now();
      try {
        await session.transport.handleRequest(req, res);
      } catch (err) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      }
      return;
    }

    // Initialize new session on POST without mcp-session-id
    if (req.method === 'POST') {
      const newSessionId = randomUUID();
      const server = serverFactory({ serverInfo: { sessionId: newSessionId } });
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
      });

      const sessionRecord = {
        server,
        transport,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        closing: false,
      };

      sessions.set(newSessionId, sessionRecord);

      transport.onclose = () => {
        sessions.delete(newSessionId);
        if (!sessionRecord.closing) {
          sessionRecord.closing = true;
          server.close().catch(() => {});
        }
      };

      try {
        await server.connect(transport);
        await transport.handleRequest(req, res);
      } catch (err) {
        sessions.delete(newSessionId);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      }
      return;
    }

    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad request: missing Mcp-Session-Id header' }));
  });

  return {
    httpServer,
    sessions,
    async listen(port = 3000, host = '127.0.0.1') {
      return new Promise((resolve, reject) => {
        httpServer.once('error', reject);
        httpServer.listen(port, host, () => {
          httpServer.off('error', reject);
          const addr = httpServer.address();
          resolve({ port: addr.port, host: addr.address });
        });
      });
    },
    async close() {
      const activeSessions = Array.from(sessions.values());
      sessions.clear();
      for (const session of activeSessions) {
        if (!session.closing) {
          session.closing = true;
          try {
            await session.server.close();
          } catch { /* ignore */ }
        }
      }
      return new Promise((resolve) => {
        httpServer.close(() => resolve());
      });
    },
  };
}
