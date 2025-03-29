import { logger, formatError } from '@surface.dev/utils';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { match } from 'path-to-regexp';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as errors from '../errors';
import { JSON_MIME_TYPE } from '../constants';
import {
  Tool,
  ToolInput,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Resources,
  ResourceType,
  ReadResourceParams,
} from '../types';

const DEFAULT_SERVER_OPTS = {
  capabilities: {
    tools: {},
    resources: {},
  },
};

export type StdioServerParams = {
  name: string;
  version: string;
  tools?: Tool[];
  resources?: Resources;
};

export class StdioServer {
  name: string;
  version: string;
  tools: Tool[];
  toolsMap: Record<string, Tool> = {};
  resources?: Resources;
  resourceTypesMap: Record<string, ResourceType> = {};
  private server: Server;
  private transport: StdioServerTransport;

  constructor({ name, version, tools, resources }: StdioServerParams) {
    this.name = name;
    this.version = version;
    this.tools = tools || [];
    this.resources = resources;

    // Map tools & resource types by name.
    this.tools.forEach((tool) => {
      this.toolsMap[tool.name] = tool;
    });
    this.resources?.types.forEach((type) => {
      this.resourceTypesMap[type.name] = type;
    });

    // MCP server & transport.
    this.server = new Server({ name, version }, DEFAULT_SERVER_OPTS);
    this.transport = new StdioServerTransport();

    // Register tool & resource handlers.
    this._setupListToolsHandler();
    this._setupCallToolHandler();
    this._setupListResourcesHandler();
    this._setupReadResourceHandler();
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

      // Call tool & return output as stringified text ('bytes' type not yet supported).
      try {
        const output = await tool.call(parsed.data);
        return { content: [{ type: 'text', text: JSON.stringify(output) }] };
      } catch (err) {
        const error = formatError(errors.TOOL_CALL_FAILED, err, { name, args });
        logger.error(error);
        throw error;
      }
    });
  }

  // ============================
  //  Resource Handlers
  // ============================

  private _setupListResourcesHandler() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resourceTypes = this.resources?.types || [];
      try {
        const resources = (await Promise.all(resourceTypes.map((rt) => rt.list()))).flat();
        return { resources };
      } catch (err) {
        const error = formatError(errors.LISTING_RESOURCES_FAILED, err);
        logger.error(error);
        throw error;
      }
    });
  }

  private _setupReadResourceHandler() {
    this.server.setRequestHandler(ReadResourceRequestSchema, async ({ params: { uri } }) => {
      // Ensure resources are even supported/configured for this server.
      const { root, pathTemplate } = this.resources?.uri || {};
      if (!root || !pathTemplate) {
        logger.error(errors.RESOURCES_NOT_CONFIGURED);
        throw errors.RESOURCES_NOT_CONFIGURED;
      }

      // Validate resource URI begins with configured data source root.
      if (!uri.startsWith(root + '/')) {
        const error = formatError(errors.INVALID_RESOURCE_URI, uri);
        logger.error(error);
        throw error;
      }

      // Extract params from resource URI.
      const path = uri.replace(root, '');
      const matchPath = match(pathTemplate);
      const parsed = matchPath(path) || ({} as any);
      const params = parsed.params || ({} as ReadResourceParams);
      const resourceTypeName = params.resourceType;
      if (!resourceTypeName) {
        const error = formatError(errors.INVALID_RESOURCE_URI, uri);
        logger.error(error);
        throw error;
      }

      // Ensure resource type exists.
      const resourceType = this.resourceTypesMap[resourceTypeName];
      if (!resourceType) {
        const error = formatError(errors.UNKNOWN_RESOURCE_TYPE, resourceTypeName);
        logger.error(error);
        throw error;
      }

      // Read resource of given type.
      try {
        const data = await resourceType.read(params);
        const mimeType = resourceType.mimeType;
        const text = mimeType === JSON_MIME_TYPE ? JSON.stringify(data) : data;
        return { contents: [{ uri, mimeType, text }] };
      } catch (err) {
        const error = formatError(errors.READING_RESOURCE_FAILED, err, { uri });
        logger.error(error);
        throw error;
      }
    });
  }
}
