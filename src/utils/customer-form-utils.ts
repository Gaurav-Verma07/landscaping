import type { Customer, CustomerFormData } from "@/types/customer-types"

export function customerToFormData(customer: Customer | null): CustomerFormData {
  if (!customer)
    return {
      name: "",
      companyName: "",
      phones: [""],
      emails: [""],
      addresses: [""],
      tags: [],
      leadSource: "other",
      partnerReferralName: "",
      status: "Lead",
      reviewStatus: "",
      seasonalServiceEligibility: false,
    }
  return {
    name: customer.name ?? "",
    companyName: customer.companyName ?? "",
    phones: customer.phones?.length ? customer.phones : [""],
    emails: customer.emails?.length ? customer.emails : [""],
    addresses: customer.addresses?.length ? customer.addresses : [""],
    tags: customer.tags ?? [],
    leadSource: customer.leadSource ?? "other",
    partnerReferralName: customer.partnerReferralName ?? "",
    status: customer.status ?? "Lead",
    reviewStatus: customer.reviewStatus ?? "",
    seasonalServiceEligibility: customer.seasonalServiceEligibility ?? false,
  }
}
