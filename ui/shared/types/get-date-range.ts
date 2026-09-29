import { z } from 'zod';

export const getDateRangeSchema = z.object({
  target_date: z.string().optional().default(""),
});

export type GetDateRange = z.infer<typeof getDateRangeSchema>;
