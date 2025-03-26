import { CallToolProxyParams } from '../types';

export class TsProxy {
  async init() {}

  async callTool<I, O>({
    name,
    input,
    outputSchema,
    dataSource,
  }: CallToolProxyParams<I>): Promise<O> {
    return {} as O;
  }
}
