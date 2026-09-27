import { z } from 'zod';

const baseConfigSchema = z.object({
  headers: z.record(z.string(), z.string()).optional(),
  params: z.record(z.string(), z.any()).optional(),
  timeout: z.number().positive().optional(),
  signal: z.instanceof(AbortSignal).optional(),
});

const GetConfigSchema = baseConfigSchema.strict();
const MutationConfigSchema = baseConfigSchema
.extend({
  data: z.record(z.string(), z.any()).optional(),
})
.strict();

// Accept both absolute URLs and relative paths (e.g. /api/users)
const UrlSchema = z
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


type MutationConfigSchemaType = z.infer<typeof MutationConfigSchema>;
type GetConfigSchemaType = z.infer<typeof GetConfigSchema>;
type UrlSchemaType = z.infer<typeof UrlSchema>;

export { GetConfigSchema, MutationConfigSchema, UrlSchema };
export type {
  GetConfigSchemaType,
  MutationConfigSchemaType,
  UrlSchemaType,
};
