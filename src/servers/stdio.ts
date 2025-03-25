import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
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
  private server: Server;
  private transport: StdioServerTransport;

  constructor({
    name,
    version,
    tools,
    listResources,
    readResource,
  }: StdioServerParams) {
    this.name = name;
    this.version = version;
    this.tools = tools || [];
    this.server = new Server({ name, version });
    this.transport = new StdioServerTransport();

    // Register tool & resource handlers.
    this._registerListTools();
    this._registerCallTool();
    this._registerListResources();
    this._registerReadResource();
  }

  async connect() {
    await this.server.connect(this.transport);
  }

  // ============================
  //  Tool Handlers
  // ============================

  private _registerListTools() {
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

  private _registerCallTool() {

  }

  // ============================
  //  Resource Handlers
  // ============================

  private _registerListResources() {
  }

  private _registerReadResource() {
  }
}