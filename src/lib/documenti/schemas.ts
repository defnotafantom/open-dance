import * as z from "zod";

export const documentoMetaSchema = z.object({
  studente_id: z.uuid(),
  tipo: z.string().min(1, { error: "Indica il tipo di documento." }),
  data_scadenza: z.string().optional(),
});

export type DocumentoMetaInput = z.infer<typeof documentoMetaSchema>;
