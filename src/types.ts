import { Resource as McpResource, Tool as McpTool } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';

export type Tool = McpTool & {
  inputSchema: z.ZodSchema;
  call: (input: any) => Promise<any>;
};

export type Resource = McpResource & {
  handle: string;
  name?: string;
  text?: string;
};