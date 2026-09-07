import * as z from "zod";

export const profiloInsegnanteSchema = z.object({
  bio: z.string().max(2000).optional(),
  carriera: z.string().max(2000).optional(),
  specializzazioni: z.string().max(500).optional(),
  anni_esperienza: z.number().int().nonnegative().nullable().optional(),
  pubblicato: z.boolean(),
});

export type ProfiloInsegnanteInput = z.infer<typeof profiloInsegnanteSchema>;
