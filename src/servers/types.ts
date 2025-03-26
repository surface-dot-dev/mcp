import { z } from 'zod';
import { ToolSchema } from '@modelcontextprotocol/sdk/types.js';

export type ToolInput = z.infer<typeof ToolSchema.shape.inputSchema>;

export {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
