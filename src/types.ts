import { z } from 'zod';

export type Tool = {
  name: string;
  description?: string;
  inputSchema: z.ZodType;
  call: (input: any) => Promise<any>;
};

export type Resource = {
  uri: string;
  handle: string;
  name?: string;
  mimeType?: string;
  description?: string;
  text?: string;
};
