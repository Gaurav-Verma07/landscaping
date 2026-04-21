// Types for invoice-related entities

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  issueDate: string;
  dueDate: string;
  createdDate: string;
  sentDate?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'disputed' | 'cancelled';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  balance: number;
  notes?: string;
  attachments: InvoiceAttachment[];
  lineItems: InvoiceLineItem[];
  taxItems: InvoiceTaxItem[];
  paymentHistory: InvoicePayment[];
  reminders: InvoiceReminder[];
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  totalPrice: number;
  materialId?: string;
  service?: boolean;
  taxable: boolean;
}

export interface InvoiceAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url?: string;
  uploadedAt: string;
}

export interface InvoiceTaxItem {
  id: string;
  name: string;
  rate: number;
  amount: number;
  isPercentage: boolean;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  date: string;
  method: 'cash' | 'check' | 'credit' | 'bank' | 'other';
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  notes?: string;
}

export interface InvoiceReminder {
  id: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  scheduledFor: string;
  sentAt?: string;
  message?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface Material {
  id: string;
  name: string;
  description?: string;
  unit: string;
  unitPrice: number;
  vendorId: string;
  vendorName: string;
  sku?: string;
  stock: number;
  reorderLevel: number;
  lastOrdered?: string;
  autoPullEnabled: boolean;
  priceHistory: MaterialPriceHistory[];
}

export interface MaterialPriceHistory {
  date: string;
  price: number;
  vendorId: string;
  vendorName: string;
}

export interface LaborRate {
  id: string;
  roleId: string;
  roleName: string;
  rateType: 'hourly' | 'daily' | 'fixed';
  rate: number;
  overtimeRate?: number;
  overtimeRules?: {
    afterHours: number;
    rateMultiplier: number;
    maxHoursPerDay?: number;
    maxHoursPerWeek?: number;
  };
  defaultCrew?: string[];
}

export interface CrewAssignment {
  id: string;
  crewId: string;
  name: string;
  projectId?: string;
  invoiceId?: string;
  assignedDate: string;
  status: 'assigned' | 'completed' | 'cancelled';
  notes?: string;
}

// Invoice status types for filtering and display
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'disputed' | 'cancelled';

// Payment method types
export type PaymentMethod = 'cash' | 'check' | 'credit' | 'bank' | 'other';

// Reminder types
export type ReminderType = 'email' | 'sms' | 'push' | 'in_app';

// Unit types for materials
export type UnitType = 'per_m2' | 'per_unit' | 'per_sq_ft' | 'per_sq_yd';




