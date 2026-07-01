import { z } from 'zod';

const baseConfigSchema = z.object({
  headers: z.record(z.string(), z.string()).optional(),
  params: z.record(z.string(), z.any()).optional(),
  timeout: z.number().positive().optional(),
  signal: z.instanceof(AbortSignal).optional(),
});

const getConfigSchema = baseConfigSchema.strict();
type GetConfigSchemaType = z.infer<typeof getConfigSchema>;

const mutationConfigSchema = baseConfigSchema
  .extend({
    data: z.record(z.string(), z.any()).optional(),
  })
  .strict();
type MutationConfigSchemaType = z.infer<typeof mutationConfigSchema>;

export const bodySchema = z
  .record(z.string(), z.any())
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Request body cannot be empty',
  });
type BodySchemaType = z.infer<typeof bodySchema>;

// Accept both absolute URLs and relative paths (e.g. /api/users)
const urlSchema = z
  .string()
  .min(1, 'URL cannot be empty')
  .refine(
    (val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return val.startsWith('/');
      }
    },
    { message: 'Must be a valid URL or a relative path starting with /' }
  );
type UrlSchemaType = z.infer<typeof urlSchema>;

export { getConfigSchema, mutationConfigSchema, urlSchema };
export type {
  GetConfigSchemaType,
  MutationConfigSchemaType,
  BodySchemaType,
  UrlSchemaType,
};
