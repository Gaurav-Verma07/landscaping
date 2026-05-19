"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { FieldDescription } from "@/components/ui/field";
import type { Customer } from "@/types/customer-types"; // adjust import to your actual Customer type path

interface CustomerComboboxProps {
  customers: Customer[];
  value: string;                        // selected contactId
  onChange: (id: string) => void;
  channel?: "email" | "sms" | string;  // optional — drives the hint below the input
  placeholder?: string;
}

export function CustomerCombobox({
  customers,
  value,
  onChange,
  channel,
  placeholder = "Search by name or company...",
}: CustomerComboboxProps) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const selected = value ? customers.find((c) => c.id === value) ?? null : null;

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.companyName?.toLowerCase().includes(q) ?? false)
    );
  }, [customers, query]);

  const displayValue = selected ? selected.name : query;

  const handleSelect = (id: string) => {
    onChange(id);
    setQuery("");
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange("");       // clear selection when user starts typing
    setOpen(true);
  };

  const hint = selected
    ? channel === "email"
      ? selected.emails?.[0] || "No email"
      : channel === "sms"
        ? selected.phones?.[0] || "No phone"
        : null
    : null;

  return (
    <div className="relative">
      <Input
        value={displayValue}
        onChange={handleChange}
        onClick={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
      />

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No contacts found
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="px-3 py-2 cursor-pointer hover:bg-accent"
                onMouseDown={() => handleSelect(c.id)}
              >
                <div className="text-sm font-medium">{c.name}</div>
                {c.companyName && (
                  <div className="text-xs text-muted-foreground leading-tight">
                    {c.companyName}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {hint && <FieldDescription>{hint}</FieldDescription>}
    </div>
  );
}