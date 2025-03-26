import { ToolProxyType, NewToolProxyParams, ToolProxyInterface, DataSource } from '../types';
import { isSwiftRuntime } from '../utils/runtime';
import { SwiftProxy } from './swiftProxy';
import { TsProxy } from './tsProxy';

const getProxy = (): ToolProxyInterface => {
  return isSwiftRuntime() ? new SwiftProxy() : new TsProxy();
};

export const ToolProxy = <I, O>({
  name,
  outputSchema,
}: NewToolProxyParams): ToolProxyType<I, O> => {
  return async (input: I, dataSource: DataSource) => {
    return getProxy().callTool<I, O>({ name, input, outputSchema, dataSource });
  };
};
