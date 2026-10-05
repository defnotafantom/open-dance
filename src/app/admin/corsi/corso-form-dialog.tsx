"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { corsoSchema, type CorsoInput } from "@/lib/corsi/schemas";
import { creaCorso, aggiornaCorso } from "@/lib/corsi/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TAPPE_PERCORSO } from "@/lib/sito/costanti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export type CorsoEsistente = CorsoInput & { id: string };

const NESSUNA_TAPPA = "nessuna";

const CORSO_VUOTO: CorsoInput = {
  nome: "",
  descrizione: "",
  categoria: "",
  livello: "",
  attivo: true,
  pubblicato: false,
  tappa: null,
  eta_consigliata: "",
  impatto: "",
};

export function CorsoFormDialog({
  corso,
  trigger,
}: {
  corso?: CorsoEsistente;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<CorsoInput>({
    resolver: zodResolver(corsoSchema),
    defaultValues: corso ?? CORSO_VUOTO,
  });

  async function onSubmit(values: CorsoInput) {
    const result = corso ? await aggiornaCorso(corso.id, values) : await creaCorso(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(corso ? "Corso aggiornato." : "Corso creato.");
    setOpen(false);
    form.reset(corso ? values : CORSO_VUOTO);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) form.reset(corso ?? CORSO_VUOTO);
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{corso ? "Modifica corso" : "Nuovo corso"}</DialogTitle>
          <DialogDescription>
            Nome, categoria e livello del corso (es. Hip Hop, Bambini).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Hip Hop, Classico..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="livello"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Livello</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Bambini, Adulti..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="descrizione"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attivo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Corso attivo</FormLabel>
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-4 border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium">Pagina pubblica &quot;I corsi&quot;</p>
                <p className="text-muted-foreground text-xs">
                  Come il corso viene presentato a chi visita il sito.
                </p>
              </div>
              <FormField
                control={form.control}
                name="pubblicato"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Mostra sul sito pubblico</FormLabel>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="tappa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tappa del percorso</FormLabel>
                      <Select
                        value={field.value == null ? NESSUNA_TAPPA : String(field.value)}
                        onValueChange={(v) =>
                          field.onChange(v === NESSUNA_TAPPA || v == null ? null : Number(v))
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {(v: string | null) =>
                                TAPPE_PERCORSO.find((t) => String(t.value) === v)?.label ??
                                "Nessuna"
                              }
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NESSUNA_TAPPA}>Nessuna</SelectItem>
                          {TAPPE_PERCORSO.map((t) => (
                            <SelectItem key={t.value} value={String(t.value)}>
                              {t.value}. {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eta_consigliata"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Età consigliata</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="6-9 anni" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="impatto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cosa sviluppa (uno per riga)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder={"Coordinazione e senso del ritmo\nFiducia in se stessi\nLavoro di squadra"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvataggio..." : "Salva"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
