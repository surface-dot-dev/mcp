import { zodToJsonSchema } from 'zod-to-json-schema';
import { formatError } from '@surface.dev/utils';
import { DEFAULT_PROXY_PORT, PROXY_TOOL_CALL_PATH } from '../constants';
import { CallToolParams, CallToolProxyPayload } from '../types';
import { headers, status, methods } from '../utils/http';
import * as errors from '../errors';

export class TsClient {
  private readonly proxyHost: string;

  constructor() {
    this.proxyHost = `http://localhost:${DEFAULT_PROXY_PORT}`;
  }

  async callTool<I, O>({ name, input, outputSchema }: CallToolParams<I>): Promise<O> {
    const output = await this._request(PROXY_TOOL_CALL_PATH, { name, input });

    const parsed = outputSchema.safeParse(output);
    if (!parsed.success) {
      throw formatError(errors.INVALID_TOOL_OUTPUT, parsed.error, {
        name,
        input,
        output,
        outputSchema: zodToJsonSchema(outputSchema),
      });
    }

    return parsed.data as O;
  }

  async _request(path: string, payload: CallToolProxyPayload): Promise<any> {
    let resp: Response;
    try {
      resp = await fetch(`${this.proxyHost}${path}`, {
        method: methods.POST,
        body: JSON.stringify(payload),
        headers: headers.JSON,
      });
    } catch (err) {
      throw formatError(errors.PERFORMING_TOOL_CALL_FAILED, err, payload);
    }

    let data: any = {};
    try {
      data = (await resp.json()) || {};
    } catch (err) {
      throw formatError(errors.ERROR_PARSING_TOOL_RESPONSE, err, payload);
    }

    if (resp.status !== status.SUCCESS) {
      throw formatError(errors.TOOL_CALL_RETURNED_ERROR, data.error || errors.UNKNOWN_ERROR, {
        ...payload,
        status: resp.status,
      });
    }

    return data;
  }
}
