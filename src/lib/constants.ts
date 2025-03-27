import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export const PROXY_TOOL_CALL_PATH = '/' + CallToolRequestSchema.shape.method.value;

export const DEFAULT_PROXY_PORT = 4444;