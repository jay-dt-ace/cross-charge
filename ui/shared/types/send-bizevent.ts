import { z } from 'zod';
import { localIngestIsRequired, fieldIsRequired } from './error-messages';

const CloudEvent = z.object({
  id: z.string({ error: fieldIsRequired }),
  source: z.string({ error: fieldIsRequired }),
  specversion: z.string({ error: fieldIsRequired }),
  type: z.string({ error: fieldIsRequired }),
  data: z.record(z.string(), z.any()).optional(),
});

export const sendBizEventSchema = z.object({
  localIngest: z.boolean({ error: localIngestIsRequired }),
  connectionId: z.string().optional(),
  bizeventRef: z.array(CloudEvent),
});

export type SendBizevent = z.infer<typeof sendBizEventSchema>;
