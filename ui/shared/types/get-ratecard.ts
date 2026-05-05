import { type z } from 'zod';

import { hasConnectionSchema } from './has-connection';

export const getRateCardSchema = hasConnectionSchema;

export type GetRateCard = z.infer<typeof getRateCardSchema>;
