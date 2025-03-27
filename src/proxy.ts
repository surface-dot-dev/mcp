#!/usr/bin/env node

import * as http from 'http';
import fs from 'fs';
import { CallToolProxyPayload } from './lib/types';
import { ev, formatError, undelimit, logger } from '@surface.dev/utils';
import { StdioProxy } from './lib/proxies/stdioProxy';
import { paths, methods, status, headers } from './lib/utils/http';
import * as errors from './lib/errors';

// ============================
//  Constants
// ============================

const config = {
  PORT: Number(ev('MCP_PROXY_PORT', 4444)),
  MCP_SERVER_PATH: ev('MCP_SERVER_PATH', ''),
  MCP_SERVER_ENV_VARS: undelimit(ev('MCP_SERVER_ENV_VARS', '')).filter((v) => !!v),
};

if (!config.MCP_SERVER_PATH) {
  throw formatError(errors.STDIO_SERVER_PATH_NOT_SET);
}

// ============================
//  Stdio MCP Server
// ============================

const serverPath = fs.realpathSync(config.MCP_SERVER_PATH);
if (!fs.existsSync(serverPath)) {
  throw formatError(errors.STDIO_SERVER_FILE_NOT_FOUND, serverPath);
}

const mcpServer = new StdioProxy({
  serverPath,
  envVars: config.MCP_SERVER_ENV_VARS,
});

// ============================
//  HTTP Proxy
// ============================

async function collectRequestData(req: http.IncomingMessage): Promise<string> {
  let data = '';
  return new Promise((resolve) => {
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
  });
}

function parseAndValidatePayload(data: string): CallToolProxyPayload {
  try {
    const payload = JSON.parse(data);
    const { name, input } = payload;
    if (!name || !input) {
      throw formatError(errors.INVALID_TOOL_CALL_PAYLOAD, data);
    }
    return { name, input };
  } catch (err) {
    throw formatError(errors.INVALID_TOOL_CALL_PAYLOAD, err, { data });
  }
}

async function proxyToolCall(req: http.IncomingMessage, res: http.ServerResponse) {
  // Parse/validate payload.
  let payload: CallToolProxyPayload;
  try {
    const data = await collectRequestData(req);
    payload = parseAndValidatePayload(data);
  } catch (err: unknown) {
    const error = err as Error;
    logger.error(error.message);
    res.writeHead(status.INVALID_PAYLOAD, headers.JSON);
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  // Proxy tool call to the MCP server.
  const { name, input } = payload;
  try {
    const output = await mcpServer.callTool(name, input);
    res.writeHead(status.SUCCESS, headers.JSON);
    res.end(JSON.stringify(output));
  } catch (err) {
    const error = err as Error;
    logger.error(error.message);
    res.writeHead(status.INTERNAL_ERROR, headers.JSON);
    res.end(JSON.stringify({ error: error.message }));
  }
}

const httpProxy = http.createServer();

httpProxy.on('request', async (req, res) => {
  if (req.method === methods.POST && req.url === paths.CALL_TOOL) {
    await proxyToolCall(req, res);
    return;
  }
  res.writeHead(status.NOT_FOUND, headers.JSON);
  res.end(JSON.stringify({ error: errors.ROUTE_NOT_SUPPORTED }));
});

httpProxy.listen(config.PORT, async () => {
  logger.info(`HTTP proxy running on port ${config.PORT}...`);
  await mcpServer.connect();
});
