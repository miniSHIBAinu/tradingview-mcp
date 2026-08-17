import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createChartReaderServer } from './chart-reader-server.js';

export { createChartReaderServer };

const server = createChartReaderServer();
const transport = new StdioServerTransport();
await server.connect(transport);
