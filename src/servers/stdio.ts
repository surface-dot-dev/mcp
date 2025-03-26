import { logger, formatError } from '@surface.dev/utils';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import * as errors from '../errors';
import { Tool, Resource } from '../types';
import {
  ToolInput,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from './types';

export type StdioServerParams = {
  name: string;
  version: string;
  tools?: Tool[];
  listResources?: () => Promise<Resource[]>;
  readResource?: (uri: string) => Promise<Resource>;
};

export class StdioServer {
  name: string;
  version: string;
  tools: Tool[];
  toolsMap: Record<string, Tool> = {};
  private server: Server;
  private transport: StdioServerTransport;

  constructor({ name, version, tools, listResources, readResource }: StdioServerParams) {
    this.name = name;
    this.version = version;
    this.tools = tools || [];
    this.tools.forEach(tool => { this.toolsMap[tool.name] = tool; });
    this.server = new Server({ name, version });
    this.transport = new StdioServerTransport();

    // Register tool & resource handlers.
    this._setupListToolsHandler();
    this._setupCallToolHandler();
    this._setupListResourcesHandler(listResources);
    this._setupReadResourceHandler(readResource);
  }

  async connect() {
    await this.server.connect(this.transport);
  }

  // ============================
  //  Tool Handlers
  // ============================

  private _setupListToolsHandler() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema: zodToJsonSchema(inputSchema) as ToolInput,
        })),
      };
    });
  }

  private _setupCallToolHandler() {
    this.server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
      const { name, arguments: args } = params;

      // Ensure tool actually exists.
      const tool = this.toolsMap[name];
      if (!tool) {
        const error = formatError(errors.TOOL_NOT_FOUND, name);
        logger.error(error);
        throw error;
      }

      // Validate input args structure.
      const parsed = tool.inputSchema.safeParse(args);
      if (!parsed.success) {
        const error = formatError(errors.INVALID_TOOL_INPUT, parsed.error, { name, args });
        logger.error(error);
        throw error;
      }

      try {
        const output = await tool.call(parsed.data);
        return { content: [{ type: 'text', text: JSON.stringify(output) }] };
      } catch (err: unknown) {
        const error = formatError(errors.TOOL_CALL_FAILED, err, { name, args });
        logger.error(error);
        throw error;
      }
    });
  }

  // ============================
  //  Resource Handlers
  // ============================

  private _setupListResourcesHandler(listResources?: () => Promise<Resource[]>) {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const resources = listResources ? await listResources() : [];
        return { resources };
      } catch (err: unknown) {
        const error = formatError(errors.LISTING_RESOURCES_FAILED, err);
        logger.error(error);
        throw error;
      }
    });
  }

  private _setupReadResourceHandler(readResource?: (uri: string) => Promise<Resource>) {
    this.server.setRequestHandler(ReadResourceRequestSchema, async ({ params }) => {
      const { uri } = params;

      if (!readResource) {
        logger.error(errors.READ_RESOURCE_NOT_CONFIGURED);
        throw errors.READ_RESOURCE_NOT_CONFIGURED;
      }

      try {
        const resource = await readResource(uri);
        const contents = Array.isArray(resource) ? resource : [resource];
        return { contents };
      } catch (err: unknown) {
        const error = formatError(errors.READING_RESOURCE_FAILED, err, { uri });
        logger.error(error);
        throw error;
      }
    });
  }
}
