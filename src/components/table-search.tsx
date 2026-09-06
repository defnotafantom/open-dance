"use client";

import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TableSearch({
  value,
  onChange,
  placeholder = "Cerca...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative max-w-xs">
      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}
