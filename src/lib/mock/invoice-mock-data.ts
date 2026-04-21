// Mock data for invoice-related entities

import { Invoice, Material, LaborRate, CrewAssignment, InvoicePayment, InvoiceReminder } from '@/types/invoice.types';

// Mock invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2023-001',
    clientId: 'client-001',
    clientName: 'John Carter',
    projectId: 'proj-001',
    projectName: 'Smith Residence - Roof Replacement',
    issueDate: '2023-11-15',
    dueDate: '2023-12-15',
    createdDate: '2023-11-10',
    status: 'sent',
    subtotal: 15000,
    tax: 1200,
    discount: 500,
    total: 15700,
    balance: 15700,
    notes: 'Client approved estimate, waiting for insurance adjuster visit',
    attachments: [
      {
        id: 'att-001',
        fileName: 'roof_damage_photos.zip',
        fileSize: 2048576,
        fileType: 'zip',
        uploadedAt: '2023-11-12'
      }
    ],
    lineItems: [
      {
        id: 'line-001',
        description: 'Roofing materials - Complete replacement',
        quantity: 35,
        unitPrice: 250,
        unit: 'per_m2',
        totalPrice: 8750,
        materialId: 'mat-001',
        taxable: true
      },
      {
        id: 'line-002',
        description: 'Labor - Installation',
        quantity: 80,
        unitPrice: 75,
        unit: 'per_hour',
        totalPrice: 6000,
        service: true,
        taxable: false
      },
      {
        id: 'line-003',
        description: 'Permit fees',
        quantity: 1,
        unitPrice: 500,
        unit: 'per_unit',
        totalPrice: 500,
        taxable: false
      }
    ],
    taxItems: [
      {
        id: 'tax-001',
        name: 'Sales Tax',
        rate: 8,
        amount: 1200,
        isPercentage: true
      }
    ],
    paymentHistory: [
      {
        id: 'pay-001',
        amount: 15700,
        date: '2023-12-20',
        method: 'check',
        status: 'completed',
        reference: 'Check #1234'
      }
    ],
    reminders: [],
    sentDate: '2023-11-10'
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2023-002',
    clientId: 'client-002',
    clientName: 'Maria Hernandez',
    projectId: 'proj-002',
    projectName: 'Johnson Commercial - Flat Roof',
    issueDate: '2023-11-20',
    dueDate: '2023-12-20',
    createdDate: '2023-11-15',
    status: 'overdue',
    subtotal: 25000,
    tax: 2000,
    discount: 0,
    total: 27000,
    balance: 27000,
    notes: 'Payment overdue - client not responding to calls',
    attachments: [
      {
        id: 'att-002',
        fileName: 'commercial_roof_specs.pdf',
        fileSize: 1024000,
        fileType: 'pdf',
        uploadedAt: '2023-11-18'
      }
    ],
    lineItems: [
      {
        id: 'line-004',
        description: 'Commercial roofing materials',
        quantity: 10000,
        unitPrice: 2.50,
        unit: 'per_m2',
        totalPrice: 25000,
        materialId: 'mat-002',
        taxable: true
      },
      {
        id: 'line-005',
        description: 'Labor - Commercial installation',
        quantity: 120,
        unitPrice: 100,
        unit: 'per_hour',
        totalPrice: 12000,
        service: true,
        taxable: false
      }
    ],
    taxItems: [
      {
        id: 'tax-002',
        name: 'Sales Tax',
        rate: 8,
        amount: 2000,
        isPercentage: true
      }
    ],
    paymentHistory: [
      {
        id: 'pay-002',
        amount: 10000,
        date: '2023-11-25',
        method: 'bank',
        status: 'completed',
        reference: 'Bank transfer #5678'
      }
    ],
    reminders: [
      {
        id: 'rem-001',
        type: 'email',
        scheduledFor: '2023-12-05',
        sentAt: '2023-11-25',
        message: 'Payment reminder sent',
        status: 'sent'
      }
    ],
    sentDate: '2023-11-15'
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2023-003',
    clientId: 'client-003',
    clientName: 'Robert Davis',
    projectId: 'proj-003',
    projectName: 'Williams Estate - Gutter Installation',
    issueDate: '2023-11-25',
    dueDate: '2023-12-10',
    createdDate: '2023-11-20',
    status: 'paid',
    subtotal: 8500,
    tax: 680,
    discount: 200,
    total: 8980,
    balance: 0,
    notes: 'Paid in full - thank you!',
    attachments: [],
    lineItems: [
      {
        id: 'line-006',
        description: 'Gutter materials - Aluminum',
        quantity: 200,
        unitPrice: 15,
        unit: 'per_unit',
        totalPrice: 3000,
        materialId: 'mat-003',
        taxable: true
      },
      {
        id: 'line-007',
        description: 'Labor - Gutter installation',
        quantity: 40,
        unitPrice: 75,
        unit: 'per_hour',
        totalPrice: 3000,
        service: true,
        taxable: false
      }
    ],
    taxItems: [
      {
        id: 'tax-003',
        name: 'Sales Tax',
        rate: 8,
        amount: 680,
        isPercentage: true
      }
    ],
    paymentHistory: [
      {
        id: 'pay-003',
        amount: 8980,
        date: '2023-11-28',
        method: 'check',
        status: 'completed',
        reference: 'Check #5679'
      }
    ],
    reminders: [],
    sentDate: '2023-11-20'
  },
  {
    id: 'inv-004',
    invoiceNumber: 'INV-2023-004',
    clientId: 'client-004',
    clientName: 'Kim Peterson',
    projectId: 'proj-004',
    projectName: 'Brown Bungalow - Roof Repair',
    issueDate: '2023-12-01',
    dueDate: '2023-12-15',
    createdDate: '2023-11-28',
    status: 'draft',
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    balance: 0,
    notes: 'Draft invoice - not yet sent',
    attachments: [],
    lineItems: [],
    taxItems: [],
    paymentHistory: [],
    reminders: [],
    sentDate: '2023-11-28'
  }
];

// Mock materials
export const mockMaterials: Material[] = [
  {
    id: 'mat-001',
    name: 'Asphalt Shingles - Architectural',
    description: 'Premium architectural asphalt shingles, 50-year warranty',
    unit: 'per_m2',
    unitPrice: 4.50,
    vendorId: 'vend-001',
    vendorName: 'ABC Roofing Supplies',
    stock: 5000,
    reorderLevel: 1000,
    sku: 'ASP-ARCH-50',
    lastOrdered: '2023-10-15',
    autoPullEnabled: true,
    priceHistory: [
      {
        date: '2023-09-15',
        price: 4.25,
        vendorId: 'vend-001',
        vendorName: 'ABC Roofing Supplies'
      },
      {
        date: '2023-06-20',
        price: 4.75,
        vendorId: 'vend-001',
        vendorName: 'ABC Roofing Supplies'
      }
    ]
  },
  {
    id: 'mat-002',
    name: 'Metal Roofing - Standing Seam',
    description: 'Standing seam metal roofing, 25-year warranty',
    unit: 'per_m2',
    unitPrice: 12.00,
    vendorId: 'vend-002',
    vendorName: 'MetalWorks Inc',
    stock: 2500,
    reorderLevel: 500,
    sku: 'MET-STD-SS',
    lastOrdered: '2023-11-01',
    autoPullEnabled: false,
    priceHistory: [
      {
        date: '2023-08-10',
        price: 11.50,
        vendorId: 'vend-002',
        vendorName: 'MetalWorks Inc'
      }
    ]
  },
  {
    id: 'mat-003',
    name: 'Flat Roof Membrane - TPO',
    description: 'TPO flat roof membrane, 20-year warranty',
    unit: 'per_m2',
    unitPrice: 8.50,
    vendorId: 'vend-003',
    vendorName: 'Global Roofing',
    stock: 3000,
    reorderLevel: 750,
    sku: 'TPO-FLAT-20',
    lastOrdered: '2023-09-20',
    autoPullEnabled: true,
    priceHistory: [
      {
        date: '2023-07-15',
        price: 8.25,
        vendorId: 'vend-003',
        vendorName: 'Global Roofing'
      }
    ]
  },
  {
    id: 'mat-004',
    name: 'Gutter - Aluminum',
    description: 'Aluminum seamless gutters, brown finish',
    unit: 'per_unit',
    unitPrice: 18.00,
    vendorId: 'vend-004',
    vendorName: 'Gutter Works',
    stock: 800,
    reorderLevel: 200,
    sku: 'GUT-ALU-BRN',
    lastOrdered: '2023-10-01',
    autoPullEnabled: false,
    priceHistory: []
  }
];

// Mock labor rates
export const mockLaborRates: LaborRate[] = [
  {
    id: 'rate-001',
    roleId: 'role-001',
    roleName: 'Crew Lead',
    rateType: 'hourly',
    rate: 45,
    overtimeRate: 67.50,
    defaultCrew: ['crew-001', 'crew-002'],
    overtimeRules: {
      afterHours: 8,
      rateMultiplier: 1.5,
      maxHoursPerDay: 10,
      maxHoursPerWeek: 50
    }
  },
  {
    id: 'rate-002',
    roleId: 'role-002',
    roleName: 'Roofing Specialist',
    rateType: 'hourly',
    rate: 65,
    overtimeRate: 97.50,
    defaultCrew: ['crew-002', 'crew-003'],
    overtimeRules: {
      afterHours: 8,
      rateMultiplier: 1.5,
      maxHoursPerDay: 10,
      maxHoursPerWeek: 50
    }
  },
  {
    id: 'rate-003',
    roleId: 'role-003',
    roleName: 'General Laborer',
    rateType: 'daily',
    rate: 350,
    defaultCrew: ['crew-003'],
    overtimeRules: {
      afterHours: 8,
      rateMultiplier: 1.25,
      maxHoursPerDay: 10,
      maxHoursPerWeek: 50
    }
  },
  {
    id: 'rate-004',
    roleId: 'role-004',
    roleName: 'Project Manager',
    rateType: 'hourly',
    rate: 85,
    overtimeRate: 127.50,
    defaultCrew: [],
    overtimeRules: {
      afterHours: 8,
      rateMultiplier: 1.5,
      maxHoursPerDay: 12,
      maxHoursPerWeek: 60
    }
  }
];

// Mock crew assignments
export const mockCrewAssignments: CrewAssignment[] = [
  {
    id: 'assign-001',
    crewId: 'crew-001',
    name: 'Crew Alpha',
    projectId: 'proj-001',
    invoiceId: 'inv-001',
    assignedDate: '2023-11-15',
    status: 'completed',
    notes: 'Completed roof replacement'
  },
  {
    id: 'assign-002',
    crewId: 'crew-002',
    name: 'Crew Beta',
    projectId: 'proj-002',
    invoiceId: 'inv-002',
    assignedDate: '2023-11-20',
    status: 'completed',
    notes: 'Completed commercial flat roof'
  },
  {
    id: 'assign-003',
    crewId: 'crew-003',
    name: 'Crew Gamma',
    projectId: 'proj-003',
    invoiceId: 'inv-003',
    assignedDate: '2023-11-25',
    status: 'completed',
    notes: 'Completed gutter installation'
  },
  {
    id: 'assign-004',
    crewId: 'crew-001',
    name: 'Crew Alpha',
    projectId: 'proj-004',
    invoiceId: 'inv-004',
    assignedDate: '2023-12-01',
    status: 'completed',
    notes: 'Completed bungalow roof repair'
  }
];

// Mock projects for linking
export const mockProjects = [
  {
    id: 'proj-001',
    name: 'Smith Residence - Roof Replacement',
    clientId: 'client-001',
    status: 'completed'
  },
  {
    id: 'proj-002',
    name: 'Johnson Commercial - Flat Roof',
    clientId: 'client-002',
    status: 'completed'
  },
  {
    id: 'proj-003',
    name: 'Williams Estate - Gutter Installation',
    clientId: 'client-003',
    status: 'completed'
  },
  {
    id: 'proj-004',
    name: 'Brown Bungalow - Roof Repair',
    clientId: 'client-004',
    status: 'in_progress'
  }
];

// Mock roles
export const mockRoles = [
  {
    id: 'role-001',
    name: 'Crew Lead',
    description: 'Lead roofing crew member'
  },
  {
    id: 'role-002',
    name: 'Roofing Specialist',
    description: 'Specialized roofing crew member'
  },
  {
    id: 'role-003',
    name: 'General Laborer',
    description: 'General construction laborer'
  },
  {
    id: 'role-004',
    name: 'Project Manager',
    description: 'Manages roofing projects'
  }
];

// Mock vendors
export const mockVendors = [
  {
    id: 'vend-001',
    name: 'ABC Roofing Supplies',
    description: 'Roofing materials supplier',
    contact: {
      phone: '(555) 123-4567',
      email: 'orders@abcroofing.com',
      address: '123 Supply St, Springfield, IL'
    }
  },
  {
    id: 'vend-002',
    name: 'MetalWorks Inc',
    description: 'Metal roofing materials supplier',
    contact: {
      phone: '(555) 234-5678',
      email: 'sales@metalworks.com',
      address: '456 Metal Way, Chicago, IL'
    }
  },
  {
    id: 'vend-003',
    name: 'Global Roofing',
    description: 'TPO and commercial roofing supplier',
    contact: {
      phone: '(800) 555-0123',
      email: 'info@globalroofing.com',
      address: '789 Commerce Blvd, Houston, TX'
    }
  },
  {
    id: 'vend-004',
    name: 'Gutter Works',
    description: 'Gutter and drainage supplier',
    contact: {
      phone: '(555) 345-6789',
      email: 'sales@gutterworks.com',
      address: '234 Drain St, Springfield, IL'
    }
  }
];
