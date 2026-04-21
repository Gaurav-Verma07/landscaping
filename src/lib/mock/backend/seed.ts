import {
  mockInvoices,
  mockLaborRates,
  mockMaterials,
  mockProjects,
  mockVendors,
} from "@/lib/mock/invoice-mock-data"
import type { MockDb } from "@/lib/mock/backend/types"

function iso(d: string) {
  // Accepts YYYY-MM-DD and returns ISO-ish (keeps it simple for mock)
  return d.includes("T") ? d : `${d}T00:00:00.000Z`
}

function nowIso() {
  return new Date().toISOString()
}

export function createSeedDb(): MockDb {
  const now = nowIso()

  const clients = [
    {
      id: "client-001",
      name: "John Carter",
      phone: "(555) 123-4567",
      email: "john@example.com",
      leadSource: "Referral",
      status: "In Progress" as const,
      propertyAddress: "112 Lakeview Dr",
      billingAddress: "112 Lakeview Dr",
      homeType: "Single-family",
      roofType: "Asphalt Shingle",
      roofAge: "15",
      carrier: "State Farm",
      policyNo: "SF-12345",
      claimNo: "CL-001",
      adjusterName: "Jane Smith",
      adjusterPhone: "(555) 987-6543",
      rep: "LV",
      preferredContact: "SMS",
      internalNotes: "Referred by a past customer. Insurance claim in progress.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "client-002",
      name: "Maria Hernandez",
      phone: "(555) 234-5678",
      email: "maria@example.com",
      leadSource: "Website",
      status: "Estimate Sent" as const,
      propertyAddress: "51 Westwood Ave",
      billingAddress: "51 Westwood Ave",
      homeType: "Single-family",
      roofType: "Metal",
      roofAge: "8",
      carrier: "Allstate",
      policyNo: "AL-67890",
      claimNo: "CL-002",
      adjusterName: "Bob Johnson",
      adjusterPhone: "(555) 876-5432",
      rep: "AJ",
      preferredContact: "Email",
      internalNotes: "Commercial contact prefers email. Waiting on approval.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "client-003",
      name: "Robert Davis",
      phone: "(555) 345-6789",
      email: "robert@example.com",
      leadSource: "Storm",
      status: "Completed" as const,
      propertyAddress: "8 Brookline Ct",
      billingAddress: "8 Brookline Ct",
      homeType: "Townhouse",
      roofType: "Gutters",
      roofAge: "12",
      rep: "NS",
      preferredContact: "Phone",
      internalNotes: "Gutter work completed and paid.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "client-004",
      name: "Kim Peterson",
      phone: "(555) 456-7890",
      email: "kim@example.com",
      leadSource: "Social Media",
      status: "New Lead" as const,
      propertyAddress: "993 Hillcrest Way",
      billingAddress: "993 Hillcrest Way",
      homeType: "Single-family",
      roofType: "Asphalt Shingle",
      roofAge: "20",
      rep: "LV",
      preferredContact: "SMS",
      internalNotes: "Needs inspection for leak; might be repair vs replacement.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "client-005",
      name: "Sarah Johnson",
      phone: "(555) 777-8899",
      email: "sarah@example.com",
      leadSource: "Referral",
      status: "Scheduled" as const,
      propertyAddress: "245 Oak Street",
      billingAddress: "245 Oak Street",
      homeType: "Single-family",
      roofType: "Asphalt Shingle",
      roofAge: "10",
      carrier: "Farmers",
      policyNo: "FM-22222",
      claimNo: "CL-005",
      rep: "AJ",
      preferredContact: "Email",
      internalNotes: "Hail claim. Inspection scheduled next week.",
      createdAt: now,
      updatedAt: now,
    },
  ]

  const projects = [
    ...mockProjects.map((p) => {
      const inv = mockInvoices.find((i) => i.projectId === p.id)
      return {
        id: p.id,
        clientId: p.clientId,
        name: p.name,
        status: p.status === "completed" ? ("Completed" as const) : ("Active" as const),
        scheduledDate: inv?.issueDate ? iso(inv.issueDate) : undefined,
        crew: p.id === "proj-001" ? "Crew A" : p.id === "proj-002" ? "Crew B" : p.id === "proj-003" ? "Crew C" : "Crew A",
        location:
          clients.find((c) => c.id === p.clientId)?.propertyAddress ?? "—",
        estValue: inv?.total ?? 0,
        overdue: inv?.status === "overdue",
        weatherRisk: p.id === "proj-002" ? ("Medium" as const) : p.id === "proj-003" ? ("High" as const) : ("Low" as const),
        tags: p.id === "proj-002" ? ["commercial"] : ["residential"],
        description: inv?.notes ?? "",
        createdAt: now,
        updatedAt: now,
      }
    }),
    {
      id: "proj-005",
      clientId: "client-005",
      name: "Johnson Residence - Hail Claim",
      status: "Pending" as const,
      scheduledDate: iso("2023-12-18"),
      crew: "Crew B",
      location: "245 Oak Street",
      estValue: 11000,
      overdue: false,
      weatherRisk: "Medium" as const,
      tags: ["residential", "insurance"],
      description: "Insurance claim for hail damage",
      createdAt: now,
      updatedAt: now,
    },
  ]

  const roles = [
    { id: "role-admin", name: "Admin", description: "Full access" },
    { id: "role-pm", name: "Project Manager", description: "Manages projects and schedules" },
    { id: "role-sales", name: "Sales Rep", description: "Leads, estimates, storm deals" },
    { id: "role-accounting", name: "Accounting", description: "Invoices, payments, reporting" },
  ]

  const users = [
    {
      id: "user-001",
      name: "Ava Brooks",
      email: "ava@landscaping.app",
      roleId: "role-admin",
      roleName: "Admin",
      active: true,
      twoFactorEnabled: true,
      phone: "(555) 100-0001",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-002",
      name: "Noah Reed",
      email: "noah@landscaping.app",
      roleId: "role-pm",
      roleName: "Project Manager",
      active: true,
      twoFactorEnabled: false,
      phone: "(555) 100-0002",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-003",
      name: "Layla Vega",
      email: "layla@landscaping.app",
      roleId: "role-sales",
      roleName: "Sales Rep",
      active: true,
      twoFactorEnabled: true,
      phone: "(555) 100-0003",
      createdAt: now,
      updatedAt: now,
    },
  ]

  const subcontractors = [
    {
      id: "sub-001",
      name: "Alpha Roofing Crew",
      trade: "Roofing" as const,
      insured: true,
      w9OnFile: true,
      active: true,
      phone: "(555) 200-0001",
      email: "alpha@subs.local",
      notes: "Strong on steep-slope tear-offs.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "sub-002",
      name: "Gutter Works Partners",
      trade: "Gutters" as const,
      insured: true,
      w9OnFile: false,
      active: true,
      phone: "(555) 200-0002",
      email: "gutter@subs.local",
      notes: "Need W9 on file.",
      createdAt: now,
      updatedAt: now,
    },
  ]

  const integrations = [
    {
      id: "int-quickbooks",
      key: "quickbooks" as const,
      name: "QuickBooks Online",
      category: "Accounting" as const,
      connected: false,
      enabledInWorkflows: false,
      updatedAt: now,
    },
    {
      id: "int-stripe",
      key: "stripe" as const,
      name: "Stripe",
      category: "Payments" as const,
      connected: false,
      enabledInWorkflows: false,
      updatedAt: now,
    },
    {
      id: "int-companycam",
      key: "companycam" as const,
      name: "CompanyCam",
      category: "Photos" as const,
      connected: true,
      enabledInWorkflows: true,
      updatedAt: now,
    },
    {
      id: "int-hover",
      key: "hover" as const,
      name: "HOVER",
      category: "Measurements" as const,
      connected: false,
      enabledInWorkflows: false,
      updatedAt: now,
    },
    {
      id: "int-pix4d",
      key: "pix4d" as const,
      name: "Pix4D",
      category: "Drone Mapping" as const,
      connected: false,
      enabledInWorkflows: false,
      updatedAt: now,
    },
  ]

  const pricing = {
    materialMarkupPct: 18,
    laborMarkupPct: 12,
    overheadPct: 10,
    profitPct: 15,
    salesTaxRatePct: 8,
    salesTaxAppliesTo: "materials_only" as const,
    stormModeBonusPct: 2,
    rounding: "nearest_10" as const,
    updatedAt: now,
  }

  const settings = {
    companyName: "Landscaping",
    phone: "(555) 300-0000",
    email: "ops@landscaping.app",
    address: "123 Roofing Way, Springfield, IL",
    invoicePrefix: "INV",
    paymentTermsDays: 15,
    warrantyBlurb: "Workmanship warranty: 5 years. Manufacturer warranty per product.",
    notifyEmail: true,
    notifySms: false,
    voiceAssistantEnabled: true,
    voiceWakeWord: "Landscaping",
    theme: "system" as const,
    brandColor: "#0ea5e9",
    updatedAt: now,
  }

  const templates = [
    {
      id: "tmpl-001",
      name: "Architectural Shingle Replacement",
      category: "Roof Replacement" as const,
      notes: "Standard tear-off + underlayment + architectural shingles.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "tmpl-002",
      name: "Leak Repair - Basic",
      category: "Repair" as const,
      notes: "Minimum service call + patch/replace damaged area.",
      createdAt: now,
      updatedAt: now,
    },
  ]

  const reps = [
    { id: "rep-001", name: "AJ", phone: "(555) 400-0001", email: "aj@storm.local", territory: "North", status: "busy" as const, stormCertified: true, active: true, createdAt: now, updatedAt: now },
    { id: "rep-002", name: "LV", phone: "(555) 400-0002", email: "lv@storm.local", territory: "South", status: "available" as const, stormCertified: true, active: true, createdAt: now, updatedAt: now },
    { id: "rep-003", name: "NS", phone: "(555) 400-0003", email: "ns@storm.local", territory: "West", status: "offline" as const, stormCertified: false, active: false, createdAt: now, updatedAt: now },
  ]

  const deals = [
    {
      id: "deal-001",
      dealNumber: "ST-1001",
      clientId: "client-005",
      projectId: "proj-005",
      repId: "rep-001",
      stage: "Filed Claim" as const,
      estimatedTotal: 11000,
      supplementPotential: 2000,
      lastTouchAt: iso("2023-12-05"),
      notes: "Hail claim filed. Waiting adjuster.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "deal-002",
      dealNumber: "ST-1002",
      clientId: "client-001",
      projectId: "proj-001",
      repId: "rep-002",
      stage: "Approved" as const,
      estimatedTotal: 15700,
      supplementPotential: 1500,
      lastTouchAt: iso("2023-12-10"),
      notes: "Approved with scope. Schedule crew.",
      createdAt: now,
      updatedAt: now,
    },
  ]

  const commissionPlans = [
    { id: "plan-001", name: "Standard Storm Plan", basePct: 8, supplementPct: 3, stormBonusPct: 2, minimumPayout: 500, active: true, updatedAt: now },
    { id: "plan-002", name: "Senior Rep Plan", basePct: 10, supplementPct: 4, stormBonusPct: 3, minimumPayout: 750, active: false, updatedAt: now },
  ]

  const payouts = [
    {
      id: "payout-001",
      repId: "rep-002",
      dealId: "deal-002",
      planId: "plan-001",
      amount: 1256,
      status: "due" as const,
      createdAt: now,
      updatedAt: now,
    },
  ]

  return {
    version: 1,
    clients,
    projects,
    invoices: mockInvoices.map((i) => ({ ...i })),
    materials: mockMaterials.map((m) => ({ ...m })),
    laborRates: mockLaborRates.map((r) => ({ ...r })),
    vendors: mockVendors.map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description,
      contact: v.contact,
      createdAt: now,
      updatedAt: now,
    })),
    estimates: { templates },
    storm: {
      enabled: false,
      reps,
      deals,
      commissionPlans,
      payouts,
    },
    management: {
      roles,
      users,
      subcontractors,
      integrations,
      pricing,
      settings,
    },
  }
}

