import { cn } from "cn";

/** Vista a card per elenchi tabellari su mobile: la <Table> resta per md+
 * (overflow-x-auto), questa e' l'equivalente leggibile senza scroll
 * orizzontale su schermi stretti. */
function DataList({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="data-list" className={cn("flex flex-col gap-3 md:hidden", className)} {...props} />;
}

function DataListItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-list-item"
      className={cn("flex flex-col gap-2 rounded-lg border p-4", className)}
      {...props}
    />
  );
}

function DataListRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-list-row"
      className={cn("flex items-center justify-between gap-3 text-sm", className)}
      {...props}
    />
  );
}

function DataListLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="data-list-label"
      className={cn("text-muted-foreground text-xs uppercase tracking-wide", className)}
      {...props}
    />
  );
}

export { DataList, DataListItem, DataListRow, DataListLabel };
