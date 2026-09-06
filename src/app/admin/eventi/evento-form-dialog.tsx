"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { eventoSchema, type EventoInput } from "@/lib/eventi/schemas";
import { creaEvento, aggiornaEvento } from "@/lib/eventi/actions";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export type EventoEsistente = EventoInput & { id: string };

export function EventoFormDialog({
  evento,
  trigger,
}: {
  evento?: EventoEsistente;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const valoriBase: EventoInput = evento ?? {
    nome: "",
    data: "",
    luogo: "",
    descrizione: "",
  };

  const form = useForm<EventoInput>({
    resolver: zodResolver(eventoSchema),
    defaultValues: valoriBase,
  });

  async function onSubmit(values: EventoInput) {
    const result = evento ? await aggiornaEvento(evento.id, values) : await creaEvento(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(evento ? "Evento aggiornato." : "Evento creato.");
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
          <DialogTitle>{evento ? "Modifica evento" : "Nuovo evento"}</DialogTitle>
          <DialogDescription>
            Saggi, spettacoli, giornate porte aperte e altri appuntamenti della scuola.
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
                    <Input {...field} placeholder="Saggio di fine anno" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="luogo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Luogo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Teatro comunale" />
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
