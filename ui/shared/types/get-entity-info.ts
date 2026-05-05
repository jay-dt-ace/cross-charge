import { z } from 'zod';
import { fieldIsRequired } from './error-messages';

const tagAlias = z.object({
  tag_key: z.string(),
  tag_alias: z.string().optional(),
});

export const getEntityInfoSchema = z.object({
  entity: z.object({
    name: z.string({ error: fieldIsRequired }),
    id: z.string({ error: fieldIsRequired }),
    tags: z.array(z.string()),
  }),
  tagKeys: z.array(tagAlias).min(1),
});

export type GetEntityInfo = z.infer<typeof getEntityInfoSchema>;
