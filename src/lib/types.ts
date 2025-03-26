import { z } from 'zod';
import { ToolSchema } from '@modelcontextprotocol/sdk/types.js';

export {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export type Resource = {
  uri: string;
  handle: string;
  name?: string;
  mimeType?: string;
  description?: string;
  text?: string;
};

export type Resources = {
  list: () => Promise<Resource[]>;
  read: (uri: string) => Promise<Resource>;
};

export type Tool = {
  name: string;
  description?: string;
  inputSchema: z.ZodType;
  call: (input: any) => Promise<any>;
};

export type ToolInput = z.infer<typeof ToolSchema.shape.inputSchema>;

export type ToolProxyType<I, O> = (input: I, dataSource: DataSource) => Promise<O>;

export type NewToolProxyParams = {
  name: string;
  outputSchema: z.ZodType;
};

export interface ToolProxyInterface {
  callTool<I, O>(params: CallToolProxyParams<I>): Promise<O>;
}

export type CallToolProxyParams<I> = {
  name: string;
  input: I;
  outputSchema: z.ZodType;
  dataSource: DataSource;
};

export type DataSource = {
  source: string;
};