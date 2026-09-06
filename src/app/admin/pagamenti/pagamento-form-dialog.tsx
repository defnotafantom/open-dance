"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  pagamentoSchema,
  TIPO_LABEL,
  METODO_LABEL,
  type PagamentoInput,
} from "@/lib/pagamenti/schemas";
import { registraPagamento, aggiornaPagamento } from "@/lib/pagamenti/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const NESSUN_METODO = "nessuno";

export type PagamentoEsistente = PagamentoInput & { id: string };
export type StudenteOpzione = { id: string; nome: string; cognome: string };

export function PagamentoFormDialog({
  studenti,
  pagamento,
  studenteIdFisso,
  trigger,
}: {
  studenti: StudenteOpzione[];
  pagamento?: PagamentoEsistente;
  studenteIdFisso?: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const valoriBase: PagamentoInput = pagamento ?? {
    studente_id: studenteIdFisso ?? "",
    tipo: "quota_corso",
    importo_dovuto: 0,
    importo_pagato: 0,
    data_scadenza: "",
    data_pagamento: "",
    metodo: null,
    note: "",
  };

  const form = useForm<PagamentoInput>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: valoriBase,
  });

  async function onSubmit(values: PagamentoInput) {
    const result = pagamento
      ? await aggiornaPagamento(pagamento.id, values)
      : await registraPagamento(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(pagamento ? "Pagamento aggiornato." : "Pagamento registrato.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) form.reset(valoriBase);
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pagamento ? "Modifica pagamento" : "Registra pagamento"}</DialogTitle>
          <DialogDescription>
            Lo stato (pagato/parziale/scaduto) viene calcolato automaticamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {!studenteIdFisso && (
              <FormField
                control={form.control}
                name="studente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Studente</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(v: string | null) => {
                              const s = studenti.find((s) => s.id === v);
                              return s ? `${s.nome} ${s.cognome}` : "Seleziona uno studente";
                            }}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {studenti.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nome} {s.cognome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(v: string | null) => TIPO_LABEL[v as PagamentoInput["tipo"]]}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TIPO_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="importo_dovuto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importo dovuto (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="importo_pagato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importo pagato (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="data_scadenza"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scadenza</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data pagamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="metodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metodo</FormLabel>
                  <Select
                    value={field.value ?? NESSUN_METODO}
                    onValueChange={(v) =>
                      field.onChange(v === NESSUN_METODO ? null : (v as PagamentoInput["metodo"]))
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(v: string | null) =>
                            v && v !== NESSUN_METODO
                              ? METODO_LABEL[v as NonNullable<PagamentoInput["metodo"]>]
                              : "Non specificato"
                          }
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NESSUN_METODO}>Non specificato</SelectItem>
                      {Object.entries(METODO_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
