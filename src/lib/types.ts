import { z } from 'zod';
import { ToolSchema } from '@modelcontextprotocol/sdk/types.js';

export {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export type DataSource = {
  source: string;
};

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

export type ToolClientType<I, O> = (input: I, dataSource: DataSource) => Promise<O>;

export type NewToolClientParams = {
  name: string;
  outputSchema: z.ZodType;
};

export interface ToolClientInterface {
  callTool<I, O>(params: CallToolParams<I>): Promise<O>;
}

export type CallToolParams<I> = {
  name: string;
  input: I;
  outputSchema: z.ZodType;
  dataSource: DataSource;
};

export type CallToolProxyPayload = {
  name: string;
  input: any;
}

export type ToolCallResult = {
  isError?: boolean;
  content: ToolCallResultContent[];
};

export type ToolCallResultContent = {
  type: ToolCallResultContentType;
  text: string;
};

export enum ToolCallResultContentType {
  Text = 'text',
}