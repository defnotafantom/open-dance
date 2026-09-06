"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { classeSchema, GIORNI_SETTIMANA, type ClasseInput } from "@/lib/corsi/schemas";
import { creaClasse, aggiornaClasse } from "@/lib/corsi/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

const NESSUN_INSEGNANTE = "nessuno";

export type ClasseEsistente = ClasseInput & { id: string };
export type Insegnante = { id: string; nome: string; cognome: string };

export function ClasseFormDialog({
  corsoId,
  classe,
  insegnanti,
  trigger,
}: {
  corsoId: string;
  classe?: ClasseEsistente;
  insegnanti: Insegnante[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const valoriBase: ClasseInput = classe ?? {
    corso_id: corsoId,
    insegnante_id: null,
    giorno_settimana: 1,
    orario_inizio: "17:00",
    orario_fine: "18:00",
    sala: "",
    capienza_max: null,
    stagione: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    attiva: true,
  };

  const form = useForm<ClasseInput>({
    resolver: zodResolver(classeSchema),
    defaultValues: valoriBase,
  });

  async function onSubmit(values: ClasseInput) {
    const result = classe ? await aggiornaClasse(classe.id, values) : await creaClasse(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(classe ? "Classe aggiornata." : "Classe creata.");
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
          <DialogTitle>{classe ? "Modifica classe" : "Nuova classe"}</DialogTitle>
          <DialogDescription>
            Giorno, orario e insegnante di questa sezione del corso.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="giorno_settimana"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giorno della settimana</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(v: string | null) => GIORNI_SETTIMANA[Number(v ?? 1)]}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GIORNI_SETTIMANA.map((giorno, idx) => (
                        <SelectItem key={idx} value={String(idx)}>
                          {giorno}
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
                name="orario_inizio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inizio</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orario_fine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fine</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="insegnante_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insegnante</FormLabel>
                  <Select
                    value={field.value ?? NESSUN_INSEGNANTE}
                    onValueChange={(v) => field.onChange(v === NESSUN_INSEGNANTE ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(v: string | null) => {
                            const ins = insegnanti.find((i) => i.id === v);
                            return ins ? `${ins.nome} ${ins.cognome}` : "Nessuno assegnato";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NESSUN_INSEGNANTE}>Nessuno assegnato</SelectItem>
                      {insegnanti.map((ins) => (
                        <SelectItem key={ins.id} value={ins.id}>
                          {ins.nome} {ins.cognome}
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
                name="sala"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sala</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capienza_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capienza max</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="stagione"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stagione</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="2026-2027" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attiva"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Classe attiva</FormLabel>
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
