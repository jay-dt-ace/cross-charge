import { z } from 'zod';
import { fieldIsRequired, qnIsRequired, ccIsRequired } from './error-messages';

const Capability = z.object({
  key: z.string({ error: fieldIsRequired }).min(1, fieldIsRequired),
  name: z.string({ error: fieldIsRequired }).min(1, fieldIsRequired),
  quotedPrice: z.string().nullable(),
  quotedUnitOfMeasure: z.string({ error: fieldIsRequired }).min(1, fieldIsRequired),
  price: z.string({ error: fieldIsRequired }).min(1, fieldIsRequired),
});

const rateCard = z.object({
  quoteNumber: z.string().min(1, qnIsRequired),
  currencyCode: z.string({ error: ccIsRequired }).min(1, ccIsRequired),
  startTime: z.string({ error: fieldIsRequired }).min(1, fieldIsRequired),
  endTime: z.string({ error: fieldIsRequired }).min(1, fieldIsRequired),
  capabilities: z.record(z.string({ error: fieldIsRequired }), Capability),
});

const entityInfo = z.object({
  entity_id: z.string({ error: fieldIsRequired }),
  entity_name: z.string({ error: fieldIsRequired }),
  tags: z.record(z.string(), z.string()),
});

const rateCards = z.object({
  rate_card: rateCard,
});

export const getBillingUsageSchema = z.object({
  entityType: z.string({ error: fieldIsRequired }),
  metricBucket: z.number().optional(),
  billingMetrics: z.array(z.string()).min(1),
  entityInfo: entityInfo,
  rateCard: rateCards,
});

export type GetBillingUsage = z.infer<typeof getBillingUsageSchema>;
