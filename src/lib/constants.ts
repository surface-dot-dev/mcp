import { CallToolRequestSchema, ResourceListChangedNotificationSchema } from './types.js';

export const PROXY_TOOL_CALL_PATH = '/' + CallToolRequestSchema.shape.method.value;

export const DEFAULT_PROXY_PORT = 4444;

export const JSON_MIME_TYPE = 'application/json';

export const RESOURCE_LIST_CHANGED_NOTIFICATION =
  ResourceListChangedNotificationSchema.shape.method.value;
