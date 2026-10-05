import type { MetadataRoute } from "next";
import { manutenzioneAttiva } from "@/lib/manutenzione";

export default function robots(): MetadataRoute.Robots {
  // Sito chiuso: nessuna indicizzazione. Riaperto: tutto tranne le aree riservate.
  if (manutenzioneAttiva()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/area-genitore", "/area-insegnante", "/stampa", "/app"],
    },
  };
}
