import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export const status = {
  SUCCESS: 200,
  INVALID_PAYLOAD: 400,
  INTERNAL_ERROR: 500,
  NOT_FOUND: 404,
};

export const methods = {
  POST: 'POST',
};

export const headers = {
  JSON: { 'Content-Type': 'application/json' },
};