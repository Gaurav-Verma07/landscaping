"use client";

import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import type { CustomerFormData } from "@/lib/customer-types";

type Props = {
  form: CustomerFormData;
  setForm: React.Dispatch<React.SetStateAction<CustomerFormData>>;
};

export function BasicInfoSection({ form, setForm }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Basic info</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Enter name"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
          <Input
            id="companyName"
            value={form.companyName}
            onChange={(e) =>
              setForm((p) => ({ ...p, companyName: e.target.value }))
            }
            placeholder="Enter company name"
          />
        </Field>
      </div>
    </div>
  );
}
