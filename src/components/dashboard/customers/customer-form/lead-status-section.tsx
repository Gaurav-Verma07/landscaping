"use client"

import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import type {
  CustomerFormData,
  CustomerStatus,
} from "@/types/customer-types"
import {
  CUSTOMER_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/types/customer-types"

type Props = {
  form: CustomerFormData
  setForm: React.Dispatch<React.SetStateAction<CustomerFormData>>
}

export function LeadStatusSection({ form, setForm }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Lead & status</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="leadSource">Lead Source</FieldLabel>
          <select
            id="leadSource"
            value={form.leadSource}
            onChange={(e) =>
              setForm((p) => ({ ...p, leadSource: e.target.value }))
            }
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="partnerReferralName">Partner Referral Name</FieldLabel>
          <Input
            id="partnerReferralName"
            value={form.partnerReferralName}
            onChange={(e) =>
              setForm((p) => ({ ...p, partnerReferralName: e.target.value }))
            }
            placeholder="Partner or referral name"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="status">Status</FieldLabel>
          <select
            id="status"
            value={form.status}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                status: e.target.value as CustomerStatus,
              }))
            }
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            {Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="reviewStatus">Review Status</FieldLabel>
          <Input
            id="reviewStatus"
            value={form.reviewStatus}
            onChange={(e) =>
              setForm((p) => ({ ...p, reviewStatus: e.target.value }))
            }
            placeholder="e.g. Pending, Approved"
          />
        </Field>
      </div>
      <Field className="flex flex-row items-center gap-2">
        <input
          type="checkbox"
          id="seasonal"
          checked={form.seasonalServiceEligibility}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              seasonalServiceEligibility: e.target.checked,
            }))
          }
          className="rounded border-input"
        />
        <FieldLabel htmlFor="seasonal">Seasonal Service Eligibility</FieldLabel>
      </Field>
    </div>
  )
}
