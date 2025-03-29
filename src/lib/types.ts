import { z } from 'zod';
import { ToolSchema } from '@modelcontextprotocol/sdk/types.js';

export {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ResourceListChangedNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js';

export type DataSource = {
  source: string;
};

export type ResourcesUriSpec = {
  root: string;
  pathTemplate: string;
};

export type Resources = {
  uri: ResourcesUriSpec;
  types: ResourceType[];
};

export type ResourceType = {
  name: string;
  mimeType: string;
  list: () => Promise<Resource[]>;
  read: (params: ReadResourceParams) => Promise<any>;
  hash: () => Promise<string>;
};

export type ReadResourceParams = Record<string, string>;

export type Resource = {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handle: string;
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
};

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
