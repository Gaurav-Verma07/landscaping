"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import type { CustomerFormData } from "@/types/customer-types"
import { appendEmpty, updateAt, removeAt } from "@/utils/utils"

type Props = {
  form: CustomerFormData
  setForm: React.Dispatch<React.SetStateAction<CustomerFormData>>
}

export function ContactSection({ form, setForm }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Contact</h3>
      <Field>
        <FieldLabel>Phone(s)</FieldLabel>
        <div className="space-y-2">
          {form.phones.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={p}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    phones: updateAt(prev.phones, i, e.target.value),
                  }))
                }
                placeholder="Phone"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    phones: removeAt(prev.phones, i),
                  }))
                }
                disabled={form.phones.length <= 1}
                aria-label="Remove phone"
              >
                −
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((prev) => ({ ...prev, phones: appendEmpty(prev.phones) }))
            }
          >
            + Add phone
          </Button>
        </div>
      </Field>
      <Field>
        <FieldLabel>Email(s)</FieldLabel>
        <div className="space-y-2">
          {form.emails.map((e, i) => (
            <div key={i} className="flex gap-2">
              <Input
                type="email"
                value={e}
                onChange={(ev) =>
                  setForm((prev) => ({
                    ...prev,
                    emails: updateAt(prev.emails, i, ev.target.value),
                  }))
                }
                placeholder="Email"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    emails: removeAt(prev.emails, i),
                  }))
                }
                disabled={form.emails.length <= 1}
                aria-label="Remove email"
              >
                −
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((prev) => ({ ...prev, emails: appendEmpty(prev.emails) }))
            }
          >
            + Add email
          </Button>
        </div>
      </Field>
      <Field>
        <FieldLabel>Address(es)</FieldLabel>
        <div className="space-y-2">
          {form.addresses.map((a, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={a}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    addresses: updateAt(prev.addresses, i, e.target.value),
                  }))
                }
                placeholder="Address"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    addresses: removeAt(prev.addresses, i),
                  }))
                }
                disabled={form.addresses.length <= 1}
                aria-label="Remove address"
              >
                −
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                addresses: appendEmpty(prev.addresses),
              }))
            }
          >
            + Add address
          </Button>
        </div>
      </Field>
    </div>
  )
}
