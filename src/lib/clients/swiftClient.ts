import { CallToolParams } from '../types';

export class SwiftClient {
  async init() {}

  async callTool<I, O>({ name, input, outputSchema, dataSource }: CallToolParams<I>): Promise<O> {
    return {} as O;
  }
}
