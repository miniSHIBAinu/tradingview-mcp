import { createMcpHttpServer } from './http-server.js';

const host = process.env.TV_HTTP_HOST || process.env.MCP_HOST || process.env.HOST || '127.0.0.1';
const port = Number(process.env.TV_HTTP_PORT || process.env.MCP_PORT || process.env.PORT) || 3000;
const authToken = process.env.TDV_MCP_AUTH_TOKEN || process.env.MCP_AUTH_TOKEN || process.env.AUTH_TOKEN;

const serverInstance = createMcpHttpServer({ host, port, authToken });
const { port: actualPort, host: actualHost } = await serverInstance.listen(port, host);

process.stderr.write(`[tdv-mcp] Streamable HTTP server listening on http://${actualHost}:${actualPort}/mcp\n`);
if (authToken) {
  process.stderr.write('[tdv-mcp] Bearer token authentication is enabled.\n');
} else {
  process.stderr.write('[tdv-mcp] Notice: Server running without authentication token (dev mode).\n');
}

const shutdown = async () => {
  process.stderr.write('[tdv-mcp] Shutting down HTTP server...\n');
  await serverInstance.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
