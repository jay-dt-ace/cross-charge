import { z } from 'zod';
import { connectionIdIsRequired } from '../types/error-messages';

export const hasConnectionSchema = z.object({
  connectionId: z
    .string({
      error: connectionIdIsRequired,
    })
    .min(1, connectionIdIsRequired),
});
