import { CallToolParams } from '../types';

export class TsClient {
  async init() {}

  async callTool<I, O>({ name, input, outputSchema, dataSource }: CallToolParams<I>): Promise<O> {
    return {} as O;
  }
}
