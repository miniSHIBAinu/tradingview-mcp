# Debug Knowledge Base

## RangeError: Maximum call stack size exceeded on Streamable HTTP transport closure

### Symptom
When closing an MCP session or shutting down `StreamableHTTPServerTransport`, an unhandled rejection with `RangeError: Maximum call stack size exceeded` was triggered during asynchronous cleanup.

### Root cause
In `@modelcontextprotocol/sdk`, calling `server.close()` invokes `transport.close()`. The transport's `onclose` callback was also invoking `server.close()`, creating an un-guarded mutual recursive loop between the server and transport close handlers.

### Verified fix
In `src/http-server.js`, added a `closing` boolean flag on the session record to prevent re-entrant calls when either `transport.onclose` or `server.close()` initiates session termination.

### Prevention / Fast path
Always guard transport lifecycle hooks (`onclose`, `onerror`) against recursive calls back into `server.close()`.
