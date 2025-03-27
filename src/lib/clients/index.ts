import { ToolClientType, NewToolClientParams, ToolClientInterface, DataSource } from '../types';
import { isSwiftRuntime } from '../utils/runtime';
import { SwiftClient } from './swiftClient';
import { TsClient } from './tsClient';

const getClient = (): ToolClientInterface => {
  return isSwiftRuntime() ? new SwiftClient() : new TsClient();
};

export const ToolClient = <I, O>({
  name,
  outputSchema,
}: NewToolClientParams): ToolClientType<I, O> => {
  return async (input: I, dataSource: DataSource) => {
    return getClient().callTool<I, O>({ name, input, outputSchema, dataSource });
  };
};
