import { z } from 'zod';
import { fieldIsRequired } from './error-messages';

export const getEntitiesSchema = z.object({
  entityType: z.string({ error: fieldIsRequired }),
  otherType: z.string({ error: fieldIsRequired }).optional(),
  billingMetrics: z.string({ error: fieldIsRequired }),
});

export type GetEntities = z.infer<typeof getEntitiesSchema>;
