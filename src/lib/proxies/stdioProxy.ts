import fs from 'fs';
import { ev, formatError, safeJsonStringify as stringify, logger } from '@surface.dev/utils';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ToolCallResult, ToolCallResultContentType } from '../types';
import * as errors from '../errors';

const CLIENT_PARAMS = {
  name: 'stdio-proxy-client',
  version: '1.0.0',
};

const CLIENT_OPTS = {
  capabilities: {
    tools: {},
    resources: {},
  },
};

export type StdioProxyParams = {
  serverPath: string;
  envVars?: string[];
};

export class StdioProxy {
  private serverPath: string;
  private envsMap: Record<string, string> = {};
  private client: Client;
  private isInitialized: boolean = false;

  constructor({ serverPath, envVars = [] }: StdioProxyParams) {
    this.serverPath = serverPath;
    envVars.forEach((name) => {
      this.envsMap[name] = ev(name, '');
    });
    this.client = new Client(CLIENT_PARAMS, CLIENT_OPTS);
  }

  async connect() {
    if (!fs.existsSync(this.serverPath)) {
      throw formatError(errors.STDIO_SERVER_FILE_NOT_FOUND, this.serverPath);
    }
    try {
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [this.serverPath],
        env: this.envsMap,
      });
      await this.client.connect(transport);
      this.isInitialized = true;
      logger.info('MCP proxy connected.');
    } catch (err: unknown) {
      throw formatError(errors.MCP_CONNECTION_ERROR, err);
    }
  }

  async callTool(name: string, input: any): Promise<any> {
    if (!this.isInitialized) {
      throw errors.MCP_CLIENT_NOT_INITIALIZED;
    }

    // Call tool and handle *MCP-level* errors.
    const errorParams = { name, input: stringify(input || {}) };
    let result: ToolCallResult;
    try {
      result = (await this.client.callTool({ name, arguments: input || {} })) as ToolCallResult;
    } catch (err: unknown) {
      throw formatError(errors.PERFORMING_TOOL_CALL_FAILED, err, errorParams);
    }

    // Ensure response is of type "text".
    const content = result.content || [];
    const { type, text } = content[0] || {};
    if (type !== ToolCallResultContentType.Text) {
      throw formatError(errors.UNSUPPORTED_TOOL_CALL_RESULT_CONTENT_TYPE, type, errorParams);
    }

    // Handle *tool-level* errors (i.e. "failed successfully").
    if (result.isError) {
      throw formatError(errors.TOOL_CALL_RETURNED_ERROR, text || errors.UNKNOWN_ERROR, errorParams);
    }

    try {
      return JSON.parse(text);
    } catch (err) {
      throw formatError(errors.ERROR_PARSING_TOOL_RESPONSE, err, {
        ...errorParams,
        content,
      });
    }
  }
}
