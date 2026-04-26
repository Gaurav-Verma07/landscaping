create table "public"."appointments" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "customer_id" uuid,
    "project_id" uuid,
    "address" text,
    "start_at" timestamp with time zone not null,
    "end_at" timestamp with time zone not null,
    "assigned_user_ids" text[] default '{}'::uuid[],
    "equipment_required" text[] default '{}'::text[],
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."appointments" enable row level security;

create table "public"."audit_log" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid,
    "user_id" uuid,
    "action" text not null,
    "entity_type" text not null,
    "entity_id" uuid,
    "details" text,
    "timestamp" timestamp with time zone default now()
);


alter table "public"."audit_log" enable row level security;

create table "public"."automation_rules" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "name" text not null,
    "trigger" text not null,
    "delay_days" integer default 0,
    "template_id" uuid,
    "enabled" boolean default true,
    "created_at" timestamp with time zone default now()
);


alter table "public"."automation_rules" enable row level security;

create table "public"."communications" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "customer_id" uuid,
    "channel" text not null,
    "subject" text,
    "body" text,
    "contact_name" text,
    "contact_email" text,
    "contact_phone" text,
    "direction" text not null,
    "read" boolean default false,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."communications" enable row level security;

create table "public"."contract_templates" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "name" text not null,
    "content" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."contract_templates" enable row level security;

create table "public"."contracts" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "customer_id" uuid,
    "project_id" uuid,
    "quote_id" uuid,
    "template_id" uuid,
    "contract_number" text not null,
    "title" text,
    "content" text,
    "status" text not null default 'draft'::text,
    "signed_at" timestamp with time zone,
    "signed_by" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."contracts" enable row level security;

create table "public"."customer_attachments" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "name" text not null,
    "size" integer,
    "url" text not null,
    "uploaded_at" timestamp with time zone default now()
);


alter table "public"."customer_attachments" enable row level security;

create table "public"."customer_notes" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "content" text not null,
    "created_by" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."customer_notes" enable row level security;

create table "public"."customer_timeline_events" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "type" text not null,
    "title" text not null,
    "description" text,
    "date" timestamp with time zone not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."customer_timeline_events" enable row level security;

create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "name" text not null,
    "company_name" text,
    "phones" text[] default '{}'::text[],
    "emails" text[] default '{}'::text[],
    "addresses" text[] default '{}'::text[],
    "tags" text[] default '{}'::text[],
    "lead_source" text,
    "partner_referral_name" text,
    "status" text not null default 'Lead'::text,
    "review_status" text,
    "seasonal_service_eligibility" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."customers" enable row level security;

create table "public"."documents" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "customer_id" uuid,
    "project_id" uuid,
    "name" text not null,
    "file_url" text,
    "type" text,
    "tags" text[] default '{}'::text[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."documents" enable row level security;

create table "public"."employees" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "name" text not null,
    "email" text,
    "phone" text,
    "role" text,
    "skill_level" text,
    "certifications" text[] default '{}'::text[],
    "availability" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."employees" enable row level security;

create table "public"."equipment_assets" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "name" text not null,
    "type" text,
    "status" text default 'available'::text,
    "notes" text,
    "last_maintenance_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."equipment_assets" enable row level security;

create table "public"."equipment_bookings" (
    "id" uuid not null default gen_random_uuid(),
    "asset_id" uuid not null,
    "project_id" uuid,
    "appointment_id" uuid,
    "start_at" timestamp with time zone not null,
    "end_at" timestamp with time zone not null,
    "status" text default 'scheduled'::text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."equipment_bookings" enable row level security;

create table "public"."follow_up_sequence_steps" (
    "id" uuid not null default gen_random_uuid(),
    "sequence_id" uuid not null,
    "delay_days" integer default 0,
    "template_id" uuid,
    "sort_order" integer default 0
);


alter table "public"."follow_up_sequence_steps" enable row level security;

create table "public"."follow_up_sequences" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."follow_up_sequences" enable row level security;

create table "public"."invoice_line_items" (
    "id" uuid not null default gen_random_uuid(),
    "invoice_id" uuid not null,
    "description" text,
    "quantity" numeric default 1,
    "unit" text,
    "unit_price" numeric default 0,
    "discount_percent" numeric default 0,
    "amount" numeric default 0,
    "sort_order" integer default 0
);


alter table "public"."invoice_line_items" enable row level security;

create table "public"."invoice_payments" (
    "id" uuid not null default gen_random_uuid(),
    "invoice_id" uuid not null,
    "amount" numeric not null,
    "paid_at" timestamp with time zone default now(),
    "method" text,
    "reference" text
);


alter table "public"."invoice_payments" enable row level security;

create table "public"."invoices" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "customer_id" uuid,
    "project_id" uuid,
    "quote_id" uuid,
    "invoice_number" text not null,
    "type" text not null default 'final'::text,
    "status" text not null default 'draft'::text,
    "subtotal" numeric default 0,
    "tax_rate_percent" numeric default 0,
    "tax_amount" numeric default 0,
    "total" numeric default 0,
    "paid_amount" numeric default 0,
    "due_date" date,
    "payment_terms_days" integer default 30,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."invoices" enable row level security;

create table "public"."material_catalog" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "supplier_id" uuid,
    "name" text not null,
    "unit" text,
    "default_price" numeric default 0,
    "sku" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."material_catalog" enable row level security;

create table "public"."message_templates" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "name" text not null,
    "channel" text not null,
    "subject" text,
    "body" text,
    "updated_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


alter table "public"."message_templates" enable row level security;

create table "public"."outreach_prospects" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "name" text not null,
    "company" text,
    "target_type" text,
    "location" text,
    "industry" text,
    "company_size" text,
    "email" text,
    "phone" text,
    "notes" text,
    "stage" text default 'New'::text,
    "lead_source" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."outreach_prospects" enable row level security;

create table "public"."predefined_items" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "name" text not null,
    "description" text,
    "unit" text,
    "default_price" numeric default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."predefined_items" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "full_name" text,
    "avatar_url" text,
    "updated_at" timestamp with time zone default now(),
    "role" text not null default 'owner'::text,
    "team_name" text,
    "team_logo_url" text,
    "company_phone" text,
    "company_email" text,
    "company_address" text,
    "invoice_prefix" text default 'INV-'::text,
    "payment_terms_days" integer not null default 30,
    "warranty_blurb" text,
    "notify_email" boolean not null default true,
    "notify_sms" boolean not null default false,
    "voice_assistant_enabled" boolean not null default false,
    "voice_wake_word" text,
    "theme" text default 'system'::text,
    "brand_color" text
);


alter table "public"."profiles" enable row level security;

create table "public"."project_timeline_milestones" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "type" text not null,
    "title" text not null,
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "sort_order" integer not null default 0,
    "notes" text
);


alter table "public"."project_timeline_milestones" enable row level security;

create table "public"."projects" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "customer_id" uuid,
    "name" text not null,
    "project_type" text,
    "status" text not null default 'Planned'::text,
    "priority" text default 'Medium'::text,
    "property_size" text,
    "estimated_landscape_sqft" integer,
    "remaining_sqft" integer,
    "estimated_property_value" numeric,
    "terrain_type" text,
    "access_notes" text,
    "duration_estimate" text,
    "required_materials" text[] default '{}'::text[],
    "equipment" text[] default '{}'::text[],
    "assigned_crew" text,
    "dependency_project_ids" uuid[] default '{}'::uuid[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."projects" enable row level security;

create table "public"."quote_line_items" (
    "id" uuid not null default gen_random_uuid(),
    "quote_id" uuid not null,
    "description" text,
    "quantity" numeric default 1,
    "unit" text,
    "unit_price" numeric default 0,
    "discount_percent" numeric default 0,
    "amount" numeric default 0,
    "sort_order" integer default 0
);


alter table "public"."quote_line_items" enable row level security;

create table "public"."quotes" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "customer_id" uuid,
    "project_id" uuid,
    "quote_number" text not null,
    "status" text not null default 'draft'::text,
    "subtotal" numeric default 0,
    "tax_rate_percent" numeric default 0,
    "tax_amount" numeric default 0,
    "total" numeric default 0,
    "valid_until" date,
    "notes" text,
    "template_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."quotes" enable row level security;

create table "public"."scheduled_messages" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "customer_id" uuid,
    "contact_name" text,
    "template_id" uuid,
    "rule_id" uuid,
    "sequence_id" uuid,
    "send_at" timestamp with time zone not null,
    "status" text default 'pending'::text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."scheduled_messages" enable row level security;

create table "public"."supervisor_reports" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "date" date not null,
    "progress_notes" text,
    "photo_urls" text[] default '{}'::text[],
    "submitted_by" text,
    "submitted_at" timestamp with time zone default now()
);


alter table "public"."supervisor_reports" enable row level security;

create table "public"."suppliers" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "name" text not null,
    "contact_phone" text,
    "contact_email" text,
    "address" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."suppliers" enable row level security;

create table "public"."time_entries" (
    "id" uuid not null default gen_random_uuid(),
    "employee_id" uuid not null,
    "project_id" uuid,
    "clock_in_at" timestamp with time zone not null,
    "clock_out_at" timestamp with time zone,
    "gps_verified" boolean default false,
    "supervisor_override" boolean default false,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."time_entries" enable row level security;

CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id);

CREATE UNIQUE INDEX audit_log_pkey ON public.audit_log USING btree (id);

CREATE UNIQUE INDEX automation_rules_pkey ON public.automation_rules USING btree (id);

CREATE UNIQUE INDEX communications_pkey ON public.communications USING btree (id);

CREATE UNIQUE INDEX contract_templates_pkey ON public.contract_templates USING btree (id);

CREATE UNIQUE INDEX contracts_pkey ON public.contracts USING btree (id);

CREATE UNIQUE INDEX customer_attachments_pkey ON public.customer_attachments USING btree (id);

CREATE UNIQUE INDEX customer_notes_pkey ON public.customer_notes USING btree (id);

CREATE UNIQUE INDEX customer_timeline_events_pkey ON public.customer_timeline_events USING btree (id);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

CREATE UNIQUE INDEX employees_pkey ON public.employees USING btree (id);

CREATE UNIQUE INDEX equipment_assets_pkey ON public.equipment_assets USING btree (id);

CREATE UNIQUE INDEX equipment_bookings_pkey ON public.equipment_bookings USING btree (id);

CREATE UNIQUE INDEX follow_up_sequence_steps_pkey ON public.follow_up_sequence_steps USING btree (id);

CREATE UNIQUE INDEX follow_up_sequences_pkey ON public.follow_up_sequences USING btree (id);

CREATE UNIQUE INDEX invoice_line_items_pkey ON public.invoice_line_items USING btree (id);

CREATE UNIQUE INDEX invoice_payments_pkey ON public.invoice_payments USING btree (id);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX material_catalog_pkey ON public.material_catalog USING btree (id);

CREATE UNIQUE INDEX message_templates_pkey ON public.message_templates USING btree (id);

CREATE UNIQUE INDEX outreach_prospects_pkey ON public.outreach_prospects USING btree (id);

CREATE UNIQUE INDEX predefined_items_pkey ON public.predefined_items USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX project_timeline_milestones_pkey ON public.project_timeline_milestones USING btree (id);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);

CREATE UNIQUE INDEX quote_line_items_pkey ON public.quote_line_items USING btree (id);

CREATE UNIQUE INDEX quotes_pkey ON public.quotes USING btree (id);

CREATE UNIQUE INDEX scheduled_messages_pkey ON public.scheduled_messages USING btree (id);

CREATE UNIQUE INDEX supervisor_reports_pkey ON public.supervisor_reports USING btree (id);

CREATE UNIQUE INDEX suppliers_pkey ON public.suppliers USING btree (id);

CREATE UNIQUE INDEX time_entries_pkey ON public.time_entries USING btree (id);

alter table "public"."appointments" add constraint "appointments_pkey" PRIMARY KEY using index "appointments_pkey";

alter table "public"."audit_log" add constraint "audit_log_pkey" PRIMARY KEY using index "audit_log_pkey";

alter table "public"."automation_rules" add constraint "automation_rules_pkey" PRIMARY KEY using index "automation_rules_pkey";

alter table "public"."communications" add constraint "communications_pkey" PRIMARY KEY using index "communications_pkey";

alter table "public"."contract_templates" add constraint "contract_templates_pkey" PRIMARY KEY using index "contract_templates_pkey";

alter table "public"."contracts" add constraint "contracts_pkey" PRIMARY KEY using index "contracts_pkey";

alter table "public"."customer_attachments" add constraint "customer_attachments_pkey" PRIMARY KEY using index "customer_attachments_pkey";

alter table "public"."customer_notes" add constraint "customer_notes_pkey" PRIMARY KEY using index "customer_notes_pkey";

alter table "public"."customer_timeline_events" add constraint "customer_timeline_events_pkey" PRIMARY KEY using index "customer_timeline_events_pkey";

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."employees" add constraint "employees_pkey" PRIMARY KEY using index "employees_pkey";

alter table "public"."equipment_assets" add constraint "equipment_assets_pkey" PRIMARY KEY using index "equipment_assets_pkey";

alter table "public"."equipment_bookings" add constraint "equipment_bookings_pkey" PRIMARY KEY using index "equipment_bookings_pkey";

alter table "public"."follow_up_sequence_steps" add constraint "follow_up_sequence_steps_pkey" PRIMARY KEY using index "follow_up_sequence_steps_pkey";

alter table "public"."follow_up_sequences" add constraint "follow_up_sequences_pkey" PRIMARY KEY using index "follow_up_sequences_pkey";

alter table "public"."invoice_line_items" add constraint "invoice_line_items_pkey" PRIMARY KEY using index "invoice_line_items_pkey";

alter table "public"."invoice_payments" add constraint "invoice_payments_pkey" PRIMARY KEY using index "invoice_payments_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."material_catalog" add constraint "material_catalog_pkey" PRIMARY KEY using index "material_catalog_pkey";

alter table "public"."message_templates" add constraint "message_templates_pkey" PRIMARY KEY using index "message_templates_pkey";

alter table "public"."outreach_prospects" add constraint "outreach_prospects_pkey" PRIMARY KEY using index "outreach_prospects_pkey";

alter table "public"."predefined_items" add constraint "predefined_items_pkey" PRIMARY KEY using index "predefined_items_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."project_timeline_milestones" add constraint "project_timeline_milestones_pkey" PRIMARY KEY using index "project_timeline_milestones_pkey";

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."quote_line_items" add constraint "quote_line_items_pkey" PRIMARY KEY using index "quote_line_items_pkey";

alter table "public"."quotes" add constraint "quotes_pkey" PRIMARY KEY using index "quotes_pkey";

alter table "public"."scheduled_messages" add constraint "scheduled_messages_pkey" PRIMARY KEY using index "scheduled_messages_pkey";

alter table "public"."supervisor_reports" add constraint "supervisor_reports_pkey" PRIMARY KEY using index "supervisor_reports_pkey";

alter table "public"."suppliers" add constraint "suppliers_pkey" PRIMARY KEY using index "suppliers_pkey";

alter table "public"."time_entries" add constraint "time_entries_pkey" PRIMARY KEY using index "time_entries_pkey";

alter table "public"."appointments" add constraint "appointments_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL not valid;

alter table "public"."appointments" validate constraint "appointments_customer_id_fkey";

alter table "public"."appointments" add constraint "appointments_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."appointments" validate constraint "appointments_profile_id_fkey";

alter table "public"."appointments" add constraint "appointments_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL not valid;

alter table "public"."appointments" validate constraint "appointments_project_id_fkey";

alter table "public"."audit_log" add constraint "audit_log_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."audit_log" validate constraint "audit_log_profile_id_fkey";

alter table "public"."automation_rules" add constraint "automation_rules_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."automation_rules" validate constraint "automation_rules_profile_id_fkey";

alter table "public"."automation_rules" add constraint "automation_rules_template_id_fkey" FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE SET NULL not valid;

alter table "public"."automation_rules" validate constraint "automation_rules_template_id_fkey";

alter table "public"."communications" add constraint "communications_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL not valid;

alter table "public"."communications" validate constraint "communications_customer_id_fkey";

alter table "public"."communications" add constraint "communications_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."communications" validate constraint "communications_profile_id_fkey";

alter table "public"."contract_templates" add constraint "contract_templates_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."contract_templates" validate constraint "contract_templates_profile_id_fkey";

alter table "public"."contracts" add constraint "contracts_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL not valid;

alter table "public"."contracts" validate constraint "contracts_customer_id_fkey";

alter table "public"."contracts" add constraint "contracts_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."contracts" validate constraint "contracts_profile_id_fkey";

alter table "public"."contracts" add constraint "contracts_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL not valid;

alter table "public"."contracts" validate constraint "contracts_project_id_fkey";

alter table "public"."contracts" add constraint "contracts_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL not valid;

alter table "public"."contracts" validate constraint "contracts_quote_id_fkey";

alter table "public"."contracts" add constraint "contracts_template_id_fkey" FOREIGN KEY (template_id) REFERENCES contract_templates(id) ON DELETE SET NULL not valid;

alter table "public"."contracts" validate constraint "contracts_template_id_fkey";

alter table "public"."customer_attachments" add constraint "customer_attachments_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE not valid;

alter table "public"."customer_attachments" validate constraint "customer_attachments_customer_id_fkey";

alter table "public"."customer_notes" add constraint "customer_notes_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE not valid;

alter table "public"."customer_notes" validate constraint "customer_notes_customer_id_fkey";

alter table "public"."customer_timeline_events" add constraint "customer_timeline_events_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE not valid;

alter table "public"."customer_timeline_events" validate constraint "customer_timeline_events_customer_id_fkey";

alter table "public"."customers" add constraint "customers_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."customers" validate constraint "customers_profile_id_fkey";

alter table "public"."documents" add constraint "documents_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL not valid;

alter table "public"."documents" validate constraint "documents_customer_id_fkey";

alter table "public"."documents" add constraint "documents_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."documents" validate constraint "documents_profile_id_fkey";

alter table "public"."documents" add constraint "documents_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL not valid;

alter table "public"."documents" validate constraint "documents_project_id_fkey";

alter table "public"."employees" add constraint "employees_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."employees" validate constraint "employees_profile_id_fkey";

alter table "public"."equipment_assets" add constraint "equipment_assets_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."equipment_assets" validate constraint "equipment_assets_profile_id_fkey";

alter table "public"."equipment_bookings" add constraint "equipment_bookings_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL not valid;

alter table "public"."equipment_bookings" validate constraint "equipment_bookings_appointment_id_fkey";

alter table "public"."equipment_bookings" add constraint "equipment_bookings_asset_id_fkey" FOREIGN KEY (asset_id) REFERENCES equipment_assets(id) ON DELETE CASCADE not valid;

alter table "public"."equipment_bookings" validate constraint "equipment_bookings_asset_id_fkey";

alter table "public"."equipment_bookings" add constraint "equipment_bookings_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL not valid;

alter table "public"."equipment_bookings" validate constraint "equipment_bookings_project_id_fkey";

alter table "public"."follow_up_sequence_steps" add constraint "follow_up_sequence_steps_sequence_id_fkey" FOREIGN KEY (sequence_id) REFERENCES follow_up_sequences(id) ON DELETE CASCADE not valid;

alter table "public"."follow_up_sequence_steps" validate constraint "follow_up_sequence_steps_sequence_id_fkey";

alter table "public"."follow_up_sequence_steps" add constraint "follow_up_sequence_steps_template_id_fkey" FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE SET NULL not valid;

alter table "public"."follow_up_sequence_steps" validate constraint "follow_up_sequence_steps_template_id_fkey";

alter table "public"."follow_up_sequences" add constraint "follow_up_sequences_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."follow_up_sequences" validate constraint "follow_up_sequences_profile_id_fkey";

alter table "public"."invoice_line_items" add constraint "invoice_line_items_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_line_items" validate constraint "invoice_line_items_invoice_id_fkey";

alter table "public"."invoice_payments" add constraint "invoice_payments_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_payments" validate constraint "invoice_payments_invoice_id_fkey";

alter table "public"."invoices" add constraint "invoices_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_customer_id_fkey";

alter table "public"."invoices" add constraint "invoices_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."invoices" validate constraint "invoices_profile_id_fkey";

alter table "public"."invoices" add constraint "invoices_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_project_id_fkey";

alter table "public"."invoices" add constraint "invoices_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_quote_id_fkey";

alter table "public"."material_catalog" add constraint "material_catalog_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."material_catalog" validate constraint "material_catalog_profile_id_fkey";

alter table "public"."material_catalog" add constraint "material_catalog_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL not valid;

alter table "public"."material_catalog" validate constraint "material_catalog_supplier_id_fkey";

alter table "public"."message_templates" add constraint "message_templates_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."message_templates" validate constraint "message_templates_profile_id_fkey";

alter table "public"."outreach_prospects" add constraint "outreach_prospects_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."outreach_prospects" validate constraint "outreach_prospects_profile_id_fkey";

alter table "public"."predefined_items" add constraint "predefined_items_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."predefined_items" validate constraint "predefined_items_profile_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."project_timeline_milestones" add constraint "project_timeline_milestones_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_timeline_milestones" validate constraint "project_timeline_milestones_project_id_fkey";

alter table "public"."projects" add constraint "projects_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL not valid;

alter table "public"."projects" validate constraint "projects_customer_id_fkey";

alter table "public"."projects" add constraint "projects_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."projects" validate constraint "projects_profile_id_fkey";

alter table "public"."quote_line_items" add constraint "quote_line_items_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE not valid;

alter table "public"."quote_line_items" validate constraint "quote_line_items_quote_id_fkey";

alter table "public"."quotes" add constraint "quotes_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL not valid;

alter table "public"."quotes" validate constraint "quotes_customer_id_fkey";

alter table "public"."quotes" add constraint "quotes_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."quotes" validate constraint "quotes_profile_id_fkey";

alter table "public"."quotes" add constraint "quotes_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL not valid;

alter table "public"."quotes" validate constraint "quotes_project_id_fkey";

alter table "public"."scheduled_messages" add constraint "scheduled_messages_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL not valid;

alter table "public"."scheduled_messages" validate constraint "scheduled_messages_customer_id_fkey";

alter table "public"."scheduled_messages" add constraint "scheduled_messages_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."scheduled_messages" validate constraint "scheduled_messages_profile_id_fkey";

alter table "public"."scheduled_messages" add constraint "scheduled_messages_rule_id_fkey" FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE SET NULL not valid;

alter table "public"."scheduled_messages" validate constraint "scheduled_messages_rule_id_fkey";

alter table "public"."scheduled_messages" add constraint "scheduled_messages_sequence_id_fkey" FOREIGN KEY (sequence_id) REFERENCES follow_up_sequences(id) ON DELETE SET NULL not valid;

alter table "public"."scheduled_messages" validate constraint "scheduled_messages_sequence_id_fkey";

alter table "public"."scheduled_messages" add constraint "scheduled_messages_template_id_fkey" FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE SET NULL not valid;

alter table "public"."scheduled_messages" validate constraint "scheduled_messages_template_id_fkey";

alter table "public"."supervisor_reports" add constraint "supervisor_reports_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."supervisor_reports" validate constraint "supervisor_reports_project_id_fkey";

alter table "public"."suppliers" add constraint "suppliers_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."suppliers" validate constraint "suppliers_profile_id_fkey";

alter table "public"."time_entries" add constraint "time_entries_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE not valid;

alter table "public"."time_entries" validate constraint "time_entries_employee_id_fkey";

alter table "public"."time_entries" add constraint "time_entries_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL not valid;

alter table "public"."time_entries" validate constraint "time_entries_project_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

grant delete on table "public"."appointments" to "anon";

grant insert on table "public"."appointments" to "anon";

grant references on table "public"."appointments" to "anon";

grant select on table "public"."appointments" to "anon";

grant trigger on table "public"."appointments" to "anon";

grant truncate on table "public"."appointments" to "anon";

grant update on table "public"."appointments" to "anon";

grant delete on table "public"."appointments" to "authenticated";

grant insert on table "public"."appointments" to "authenticated";

grant references on table "public"."appointments" to "authenticated";

grant select on table "public"."appointments" to "authenticated";

grant trigger on table "public"."appointments" to "authenticated";

grant truncate on table "public"."appointments" to "authenticated";

grant update on table "public"."appointments" to "authenticated";

grant delete on table "public"."appointments" to "service_role";

grant insert on table "public"."appointments" to "service_role";

grant references on table "public"."appointments" to "service_role";

grant select on table "public"."appointments" to "service_role";

grant trigger on table "public"."appointments" to "service_role";

grant truncate on table "public"."appointments" to "service_role";

grant update on table "public"."appointments" to "service_role";

grant delete on table "public"."audit_log" to "anon";

grant insert on table "public"."audit_log" to "anon";

grant references on table "public"."audit_log" to "anon";

grant select on table "public"."audit_log" to "anon";

grant trigger on table "public"."audit_log" to "anon";

grant truncate on table "public"."audit_log" to "anon";

grant update on table "public"."audit_log" to "anon";

grant delete on table "public"."audit_log" to "authenticated";

grant insert on table "public"."audit_log" to "authenticated";

grant references on table "public"."audit_log" to "authenticated";

grant select on table "public"."audit_log" to "authenticated";

grant trigger on table "public"."audit_log" to "authenticated";

grant truncate on table "public"."audit_log" to "authenticated";

grant update on table "public"."audit_log" to "authenticated";

grant delete on table "public"."audit_log" to "service_role";

grant insert on table "public"."audit_log" to "service_role";

grant references on table "public"."audit_log" to "service_role";

grant select on table "public"."audit_log" to "service_role";

grant trigger on table "public"."audit_log" to "service_role";

grant truncate on table "public"."audit_log" to "service_role";

grant update on table "public"."audit_log" to "service_role";

grant delete on table "public"."automation_rules" to "anon";

grant insert on table "public"."automation_rules" to "anon";

grant references on table "public"."automation_rules" to "anon";

grant select on table "public"."automation_rules" to "anon";

grant trigger on table "public"."automation_rules" to "anon";

grant truncate on table "public"."automation_rules" to "anon";

grant update on table "public"."automation_rules" to "anon";

grant delete on table "public"."automation_rules" to "authenticated";

grant insert on table "public"."automation_rules" to "authenticated";

grant references on table "public"."automation_rules" to "authenticated";

grant select on table "public"."automation_rules" to "authenticated";

grant trigger on table "public"."automation_rules" to "authenticated";

grant truncate on table "public"."automation_rules" to "authenticated";

grant update on table "public"."automation_rules" to "authenticated";

grant delete on table "public"."automation_rules" to "service_role";

grant insert on table "public"."automation_rules" to "service_role";

grant references on table "public"."automation_rules" to "service_role";

grant select on table "public"."automation_rules" to "service_role";

grant trigger on table "public"."automation_rules" to "service_role";

grant truncate on table "public"."automation_rules" to "service_role";

grant update on table "public"."automation_rules" to "service_role";

grant delete on table "public"."communications" to "anon";

grant insert on table "public"."communications" to "anon";

grant references on table "public"."communications" to "anon";

grant select on table "public"."communications" to "anon";

grant trigger on table "public"."communications" to "anon";

grant truncate on table "public"."communications" to "anon";

grant update on table "public"."communications" to "anon";

grant delete on table "public"."communications" to "authenticated";

grant insert on table "public"."communications" to "authenticated";

grant references on table "public"."communications" to "authenticated";

grant select on table "public"."communications" to "authenticated";

grant trigger on table "public"."communications" to "authenticated";

grant truncate on table "public"."communications" to "authenticated";

grant update on table "public"."communications" to "authenticated";

grant delete on table "public"."communications" to "service_role";

grant insert on table "public"."communications" to "service_role";

grant references on table "public"."communications" to "service_role";

grant select on table "public"."communications" to "service_role";

grant trigger on table "public"."communications" to "service_role";

grant truncate on table "public"."communications" to "service_role";

grant update on table "public"."communications" to "service_role";

grant delete on table "public"."contract_templates" to "anon";

grant insert on table "public"."contract_templates" to "anon";

grant references on table "public"."contract_templates" to "anon";

grant select on table "public"."contract_templates" to "anon";

grant trigger on table "public"."contract_templates" to "anon";

grant truncate on table "public"."contract_templates" to "anon";

grant update on table "public"."contract_templates" to "anon";

grant delete on table "public"."contract_templates" to "authenticated";

grant insert on table "public"."contract_templates" to "authenticated";

grant references on table "public"."contract_templates" to "authenticated";

grant select on table "public"."contract_templates" to "authenticated";

grant trigger on table "public"."contract_templates" to "authenticated";

grant truncate on table "public"."contract_templates" to "authenticated";

grant update on table "public"."contract_templates" to "authenticated";

grant delete on table "public"."contract_templates" to "service_role";

grant insert on table "public"."contract_templates" to "service_role";

grant references on table "public"."contract_templates" to "service_role";

grant select on table "public"."contract_templates" to "service_role";

grant trigger on table "public"."contract_templates" to "service_role";

grant truncate on table "public"."contract_templates" to "service_role";

grant update on table "public"."contract_templates" to "service_role";

grant delete on table "public"."contracts" to "anon";

grant insert on table "public"."contracts" to "anon";

grant references on table "public"."contracts" to "anon";

grant select on table "public"."contracts" to "anon";

grant trigger on table "public"."contracts" to "anon";

grant truncate on table "public"."contracts" to "anon";

grant update on table "public"."contracts" to "anon";

grant delete on table "public"."contracts" to "authenticated";

grant insert on table "public"."contracts" to "authenticated";

grant references on table "public"."contracts" to "authenticated";

grant select on table "public"."contracts" to "authenticated";

grant trigger on table "public"."contracts" to "authenticated";

grant truncate on table "public"."contracts" to "authenticated";

grant update on table "public"."contracts" to "authenticated";

grant delete on table "public"."contracts" to "service_role";

grant insert on table "public"."contracts" to "service_role";

grant references on table "public"."contracts" to "service_role";

grant select on table "public"."contracts" to "service_role";

grant trigger on table "public"."contracts" to "service_role";

grant truncate on table "public"."contracts" to "service_role";

grant update on table "public"."contracts" to "service_role";

grant delete on table "public"."customer_attachments" to "anon";

grant insert on table "public"."customer_attachments" to "anon";

grant references on table "public"."customer_attachments" to "anon";

grant select on table "public"."customer_attachments" to "anon";

grant trigger on table "public"."customer_attachments" to "anon";

grant truncate on table "public"."customer_attachments" to "anon";

grant update on table "public"."customer_attachments" to "anon";

grant delete on table "public"."customer_attachments" to "authenticated";

grant insert on table "public"."customer_attachments" to "authenticated";

grant references on table "public"."customer_attachments" to "authenticated";

grant select on table "public"."customer_attachments" to "authenticated";

grant trigger on table "public"."customer_attachments" to "authenticated";

grant truncate on table "public"."customer_attachments" to "authenticated";

grant update on table "public"."customer_attachments" to "authenticated";

grant delete on table "public"."customer_attachments" to "service_role";

grant insert on table "public"."customer_attachments" to "service_role";

grant references on table "public"."customer_attachments" to "service_role";

grant select on table "public"."customer_attachments" to "service_role";

grant trigger on table "public"."customer_attachments" to "service_role";

grant truncate on table "public"."customer_attachments" to "service_role";

grant update on table "public"."customer_attachments" to "service_role";

grant delete on table "public"."customer_notes" to "anon";

grant insert on table "public"."customer_notes" to "anon";

grant references on table "public"."customer_notes" to "anon";

grant select on table "public"."customer_notes" to "anon";

grant trigger on table "public"."customer_notes" to "anon";

grant truncate on table "public"."customer_notes" to "anon";

grant update on table "public"."customer_notes" to "anon";

grant delete on table "public"."customer_notes" to "authenticated";

grant insert on table "public"."customer_notes" to "authenticated";

grant references on table "public"."customer_notes" to "authenticated";

grant select on table "public"."customer_notes" to "authenticated";

grant trigger on table "public"."customer_notes" to "authenticated";

grant truncate on table "public"."customer_notes" to "authenticated";

grant update on table "public"."customer_notes" to "authenticated";

grant delete on table "public"."customer_notes" to "service_role";

grant insert on table "public"."customer_notes" to "service_role";

grant references on table "public"."customer_notes" to "service_role";

grant select on table "public"."customer_notes" to "service_role";

grant trigger on table "public"."customer_notes" to "service_role";

grant truncate on table "public"."customer_notes" to "service_role";

grant update on table "public"."customer_notes" to "service_role";

grant delete on table "public"."customer_timeline_events" to "anon";

grant insert on table "public"."customer_timeline_events" to "anon";

grant references on table "public"."customer_timeline_events" to "anon";

grant select on table "public"."customer_timeline_events" to "anon";

grant trigger on table "public"."customer_timeline_events" to "anon";

grant truncate on table "public"."customer_timeline_events" to "anon";

grant update on table "public"."customer_timeline_events" to "anon";

grant delete on table "public"."customer_timeline_events" to "authenticated";

grant insert on table "public"."customer_timeline_events" to "authenticated";

grant references on table "public"."customer_timeline_events" to "authenticated";

grant select on table "public"."customer_timeline_events" to "authenticated";

grant trigger on table "public"."customer_timeline_events" to "authenticated";

grant truncate on table "public"."customer_timeline_events" to "authenticated";

grant update on table "public"."customer_timeline_events" to "authenticated";

grant delete on table "public"."customer_timeline_events" to "service_role";

grant insert on table "public"."customer_timeline_events" to "service_role";

grant references on table "public"."customer_timeline_events" to "service_role";

grant select on table "public"."customer_timeline_events" to "service_role";

grant trigger on table "public"."customer_timeline_events" to "service_role";

grant truncate on table "public"."customer_timeline_events" to "service_role";

grant update on table "public"."customer_timeline_events" to "service_role";

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."documents" to "anon";

grant insert on table "public"."documents" to "anon";

grant references on table "public"."documents" to "anon";

grant select on table "public"."documents" to "anon";

grant trigger on table "public"."documents" to "anon";

grant truncate on table "public"."documents" to "anon";

grant update on table "public"."documents" to "anon";

grant delete on table "public"."documents" to "authenticated";

grant insert on table "public"."documents" to "authenticated";

grant references on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "authenticated";

grant trigger on table "public"."documents" to "authenticated";

grant truncate on table "public"."documents" to "authenticated";

grant update on table "public"."documents" to "authenticated";

grant delete on table "public"."documents" to "service_role";

grant insert on table "public"."documents" to "service_role";

grant references on table "public"."documents" to "service_role";

grant select on table "public"."documents" to "service_role";

grant trigger on table "public"."documents" to "service_role";

grant truncate on table "public"."documents" to "service_role";

grant update on table "public"."documents" to "service_role";

grant delete on table "public"."employees" to "anon";

grant insert on table "public"."employees" to "anon";

grant references on table "public"."employees" to "anon";

grant select on table "public"."employees" to "anon";

grant trigger on table "public"."employees" to "anon";

grant truncate on table "public"."employees" to "anon";

grant update on table "public"."employees" to "anon";

grant delete on table "public"."employees" to "authenticated";

grant insert on table "public"."employees" to "authenticated";

grant references on table "public"."employees" to "authenticated";

grant select on table "public"."employees" to "authenticated";

grant trigger on table "public"."employees" to "authenticated";

grant truncate on table "public"."employees" to "authenticated";

grant update on table "public"."employees" to "authenticated";

grant delete on table "public"."employees" to "service_role";

grant insert on table "public"."employees" to "service_role";

grant references on table "public"."employees" to "service_role";

grant select on table "public"."employees" to "service_role";

grant trigger on table "public"."employees" to "service_role";

grant truncate on table "public"."employees" to "service_role";

grant update on table "public"."employees" to "service_role";

grant delete on table "public"."equipment_assets" to "anon";

grant insert on table "public"."equipment_assets" to "anon";

grant references on table "public"."equipment_assets" to "anon";

grant select on table "public"."equipment_assets" to "anon";

grant trigger on table "public"."equipment_assets" to "anon";

grant truncate on table "public"."equipment_assets" to "anon";

grant update on table "public"."equipment_assets" to "anon";

grant delete on table "public"."equipment_assets" to "authenticated";

grant insert on table "public"."equipment_assets" to "authenticated";

grant references on table "public"."equipment_assets" to "authenticated";

grant select on table "public"."equipment_assets" to "authenticated";

grant trigger on table "public"."equipment_assets" to "authenticated";

grant truncate on table "public"."equipment_assets" to "authenticated";

grant update on table "public"."equipment_assets" to "authenticated";

grant delete on table "public"."equipment_assets" to "service_role";

grant insert on table "public"."equipment_assets" to "service_role";

grant references on table "public"."equipment_assets" to "service_role";

grant select on table "public"."equipment_assets" to "service_role";

grant trigger on table "public"."equipment_assets" to "service_role";

grant truncate on table "public"."equipment_assets" to "service_role";

grant update on table "public"."equipment_assets" to "service_role";

grant delete on table "public"."equipment_bookings" to "anon";

grant insert on table "public"."equipment_bookings" to "anon";

grant references on table "public"."equipment_bookings" to "anon";

grant select on table "public"."equipment_bookings" to "anon";

grant trigger on table "public"."equipment_bookings" to "anon";

grant truncate on table "public"."equipment_bookings" to "anon";

grant update on table "public"."equipment_bookings" to "anon";

grant delete on table "public"."equipment_bookings" to "authenticated";

grant insert on table "public"."equipment_bookings" to "authenticated";

grant references on table "public"."equipment_bookings" to "authenticated";

grant select on table "public"."equipment_bookings" to "authenticated";

grant trigger on table "public"."equipment_bookings" to "authenticated";

grant truncate on table "public"."equipment_bookings" to "authenticated";

grant update on table "public"."equipment_bookings" to "authenticated";

grant delete on table "public"."equipment_bookings" to "service_role";

grant insert on table "public"."equipment_bookings" to "service_role";

grant references on table "public"."equipment_bookings" to "service_role";

grant select on table "public"."equipment_bookings" to "service_role";

grant trigger on table "public"."equipment_bookings" to "service_role";

grant truncate on table "public"."equipment_bookings" to "service_role";

grant update on table "public"."equipment_bookings" to "service_role";

grant delete on table "public"."follow_up_sequence_steps" to "anon";

grant insert on table "public"."follow_up_sequence_steps" to "anon";

grant references on table "public"."follow_up_sequence_steps" to "anon";

grant select on table "public"."follow_up_sequence_steps" to "anon";

grant trigger on table "public"."follow_up_sequence_steps" to "anon";

grant truncate on table "public"."follow_up_sequence_steps" to "anon";

grant update on table "public"."follow_up_sequence_steps" to "anon";

grant delete on table "public"."follow_up_sequence_steps" to "authenticated";

grant insert on table "public"."follow_up_sequence_steps" to "authenticated";

grant references on table "public"."follow_up_sequence_steps" to "authenticated";

grant select on table "public"."follow_up_sequence_steps" to "authenticated";

grant trigger on table "public"."follow_up_sequence_steps" to "authenticated";

grant truncate on table "public"."follow_up_sequence_steps" to "authenticated";

grant update on table "public"."follow_up_sequence_steps" to "authenticated";

grant delete on table "public"."follow_up_sequence_steps" to "service_role";

grant insert on table "public"."follow_up_sequence_steps" to "service_role";

grant references on table "public"."follow_up_sequence_steps" to "service_role";

grant select on table "public"."follow_up_sequence_steps" to "service_role";

grant trigger on table "public"."follow_up_sequence_steps" to "service_role";

grant truncate on table "public"."follow_up_sequence_steps" to "service_role";

grant update on table "public"."follow_up_sequence_steps" to "service_role";

grant delete on table "public"."follow_up_sequences" to "anon";

grant insert on table "public"."follow_up_sequences" to "anon";

grant references on table "public"."follow_up_sequences" to "anon";

grant select on table "public"."follow_up_sequences" to "anon";

grant trigger on table "public"."follow_up_sequences" to "anon";

grant truncate on table "public"."follow_up_sequences" to "anon";

grant update on table "public"."follow_up_sequences" to "anon";

grant delete on table "public"."follow_up_sequences" to "authenticated";

grant insert on table "public"."follow_up_sequences" to "authenticated";

grant references on table "public"."follow_up_sequences" to "authenticated";

grant select on table "public"."follow_up_sequences" to "authenticated";

grant trigger on table "public"."follow_up_sequences" to "authenticated";

grant truncate on table "public"."follow_up_sequences" to "authenticated";

grant update on table "public"."follow_up_sequences" to "authenticated";

grant delete on table "public"."follow_up_sequences" to "service_role";

grant insert on table "public"."follow_up_sequences" to "service_role";

grant references on table "public"."follow_up_sequences" to "service_role";

grant select on table "public"."follow_up_sequences" to "service_role";

grant trigger on table "public"."follow_up_sequences" to "service_role";

grant truncate on table "public"."follow_up_sequences" to "service_role";

grant update on table "public"."follow_up_sequences" to "service_role";

grant delete on table "public"."invoice_line_items" to "anon";

grant insert on table "public"."invoice_line_items" to "anon";

grant references on table "public"."invoice_line_items" to "anon";

grant select on table "public"."invoice_line_items" to "anon";

grant trigger on table "public"."invoice_line_items" to "anon";

grant truncate on table "public"."invoice_line_items" to "anon";

grant update on table "public"."invoice_line_items" to "anon";

grant delete on table "public"."invoice_line_items" to "authenticated";

grant insert on table "public"."invoice_line_items" to "authenticated";

grant references on table "public"."invoice_line_items" to "authenticated";

grant select on table "public"."invoice_line_items" to "authenticated";

grant trigger on table "public"."invoice_line_items" to "authenticated";

grant truncate on table "public"."invoice_line_items" to "authenticated";

grant update on table "public"."invoice_line_items" to "authenticated";

grant delete on table "public"."invoice_line_items" to "service_role";

grant insert on table "public"."invoice_line_items" to "service_role";

grant references on table "public"."invoice_line_items" to "service_role";

grant select on table "public"."invoice_line_items" to "service_role";

grant trigger on table "public"."invoice_line_items" to "service_role";

grant truncate on table "public"."invoice_line_items" to "service_role";

grant update on table "public"."invoice_line_items" to "service_role";

grant delete on table "public"."invoice_payments" to "anon";

grant insert on table "public"."invoice_payments" to "anon";

grant references on table "public"."invoice_payments" to "anon";

grant select on table "public"."invoice_payments" to "anon";

grant trigger on table "public"."invoice_payments" to "anon";

grant truncate on table "public"."invoice_payments" to "anon";

grant update on table "public"."invoice_payments" to "anon";

grant delete on table "public"."invoice_payments" to "authenticated";

grant insert on table "public"."invoice_payments" to "authenticated";

grant references on table "public"."invoice_payments" to "authenticated";

grant select on table "public"."invoice_payments" to "authenticated";

grant trigger on table "public"."invoice_payments" to "authenticated";

grant truncate on table "public"."invoice_payments" to "authenticated";

grant update on table "public"."invoice_payments" to "authenticated";

grant delete on table "public"."invoice_payments" to "service_role";

grant insert on table "public"."invoice_payments" to "service_role";

grant references on table "public"."invoice_payments" to "service_role";

grant select on table "public"."invoice_payments" to "service_role";

grant trigger on table "public"."invoice_payments" to "service_role";

grant truncate on table "public"."invoice_payments" to "service_role";

grant update on table "public"."invoice_payments" to "service_role";

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant references on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant trigger on table "public"."invoices" to "anon";

grant truncate on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant references on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant trigger on table "public"."invoices" to "service_role";

grant truncate on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

grant delete on table "public"."material_catalog" to "anon";

grant insert on table "public"."material_catalog" to "anon";

grant references on table "public"."material_catalog" to "anon";

grant select on table "public"."material_catalog" to "anon";

grant trigger on table "public"."material_catalog" to "anon";

grant truncate on table "public"."material_catalog" to "anon";

grant update on table "public"."material_catalog" to "anon";

grant delete on table "public"."material_catalog" to "authenticated";

grant insert on table "public"."material_catalog" to "authenticated";

grant references on table "public"."material_catalog" to "authenticated";

grant select on table "public"."material_catalog" to "authenticated";

grant trigger on table "public"."material_catalog" to "authenticated";

grant truncate on table "public"."material_catalog" to "authenticated";

grant update on table "public"."material_catalog" to "authenticated";

grant delete on table "public"."material_catalog" to "service_role";

grant insert on table "public"."material_catalog" to "service_role";

grant references on table "public"."material_catalog" to "service_role";

grant select on table "public"."material_catalog" to "service_role";

grant trigger on table "public"."material_catalog" to "service_role";

grant truncate on table "public"."material_catalog" to "service_role";

grant update on table "public"."material_catalog" to "service_role";

grant delete on table "public"."message_templates" to "anon";

grant insert on table "public"."message_templates" to "anon";

grant references on table "public"."message_templates" to "anon";

grant select on table "public"."message_templates" to "anon";

grant trigger on table "public"."message_templates" to "anon";

grant truncate on table "public"."message_templates" to "anon";

grant update on table "public"."message_templates" to "anon";

grant delete on table "public"."message_templates" to "authenticated";

grant insert on table "public"."message_templates" to "authenticated";

grant references on table "public"."message_templates" to "authenticated";

grant select on table "public"."message_templates" to "authenticated";

grant trigger on table "public"."message_templates" to "authenticated";

grant truncate on table "public"."message_templates" to "authenticated";

grant update on table "public"."message_templates" to "authenticated";

grant delete on table "public"."message_templates" to "service_role";

grant insert on table "public"."message_templates" to "service_role";

grant references on table "public"."message_templates" to "service_role";

grant select on table "public"."message_templates" to "service_role";

grant trigger on table "public"."message_templates" to "service_role";

grant truncate on table "public"."message_templates" to "service_role";

grant update on table "public"."message_templates" to "service_role";

grant delete on table "public"."outreach_prospects" to "anon";

grant insert on table "public"."outreach_prospects" to "anon";

grant references on table "public"."outreach_prospects" to "anon";

grant select on table "public"."outreach_prospects" to "anon";

grant trigger on table "public"."outreach_prospects" to "anon";

grant truncate on table "public"."outreach_prospects" to "anon";

grant update on table "public"."outreach_prospects" to "anon";

grant delete on table "public"."outreach_prospects" to "authenticated";

grant insert on table "public"."outreach_prospects" to "authenticated";

grant references on table "public"."outreach_prospects" to "authenticated";

grant select on table "public"."outreach_prospects" to "authenticated";

grant trigger on table "public"."outreach_prospects" to "authenticated";

grant truncate on table "public"."outreach_prospects" to "authenticated";

grant update on table "public"."outreach_prospects" to "authenticated";

grant delete on table "public"."outreach_prospects" to "service_role";

grant insert on table "public"."outreach_prospects" to "service_role";

grant references on table "public"."outreach_prospects" to "service_role";

grant select on table "public"."outreach_prospects" to "service_role";

grant trigger on table "public"."outreach_prospects" to "service_role";

grant truncate on table "public"."outreach_prospects" to "service_role";

grant update on table "public"."outreach_prospects" to "service_role";

grant delete on table "public"."predefined_items" to "anon";

grant insert on table "public"."predefined_items" to "anon";

grant references on table "public"."predefined_items" to "anon";

grant select on table "public"."predefined_items" to "anon";

grant trigger on table "public"."predefined_items" to "anon";

grant truncate on table "public"."predefined_items" to "anon";

grant update on table "public"."predefined_items" to "anon";

grant delete on table "public"."predefined_items" to "authenticated";

grant insert on table "public"."predefined_items" to "authenticated";

grant references on table "public"."predefined_items" to "authenticated";

grant select on table "public"."predefined_items" to "authenticated";

grant trigger on table "public"."predefined_items" to "authenticated";

grant truncate on table "public"."predefined_items" to "authenticated";

grant update on table "public"."predefined_items" to "authenticated";

grant delete on table "public"."predefined_items" to "service_role";

grant insert on table "public"."predefined_items" to "service_role";

grant references on table "public"."predefined_items" to "service_role";

grant select on table "public"."predefined_items" to "service_role";

grant trigger on table "public"."predefined_items" to "service_role";

grant truncate on table "public"."predefined_items" to "service_role";

grant update on table "public"."predefined_items" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."project_timeline_milestones" to "anon";

grant insert on table "public"."project_timeline_milestones" to "anon";

grant references on table "public"."project_timeline_milestones" to "anon";

grant select on table "public"."project_timeline_milestones" to "anon";

grant trigger on table "public"."project_timeline_milestones" to "anon";

grant truncate on table "public"."project_timeline_milestones" to "anon";

grant update on table "public"."project_timeline_milestones" to "anon";

grant delete on table "public"."project_timeline_milestones" to "authenticated";

grant insert on table "public"."project_timeline_milestones" to "authenticated";

grant references on table "public"."project_timeline_milestones" to "authenticated";

grant select on table "public"."project_timeline_milestones" to "authenticated";

grant trigger on table "public"."project_timeline_milestones" to "authenticated";

grant truncate on table "public"."project_timeline_milestones" to "authenticated";

grant update on table "public"."project_timeline_milestones" to "authenticated";

grant delete on table "public"."project_timeline_milestones" to "service_role";

grant insert on table "public"."project_timeline_milestones" to "service_role";

grant references on table "public"."project_timeline_milestones" to "service_role";

grant select on table "public"."project_timeline_milestones" to "service_role";

grant trigger on table "public"."project_timeline_milestones" to "service_role";

grant truncate on table "public"."project_timeline_milestones" to "service_role";

grant update on table "public"."project_timeline_milestones" to "service_role";

grant delete on table "public"."projects" to "anon";

grant insert on table "public"."projects" to "anon";

grant references on table "public"."projects" to "anon";

grant select on table "public"."projects" to "anon";

grant trigger on table "public"."projects" to "anon";

grant truncate on table "public"."projects" to "anon";

grant update on table "public"."projects" to "anon";

grant delete on table "public"."projects" to "authenticated";

grant insert on table "public"."projects" to "authenticated";

grant references on table "public"."projects" to "authenticated";

grant select on table "public"."projects" to "authenticated";

grant trigger on table "public"."projects" to "authenticated";

grant truncate on table "public"."projects" to "authenticated";

grant update on table "public"."projects" to "authenticated";

grant delete on table "public"."projects" to "service_role";

grant insert on table "public"."projects" to "service_role";

grant references on table "public"."projects" to "service_role";

grant select on table "public"."projects" to "service_role";

grant trigger on table "public"."projects" to "service_role";

grant truncate on table "public"."projects" to "service_role";

grant update on table "public"."projects" to "service_role";

grant delete on table "public"."quote_line_items" to "anon";

grant insert on table "public"."quote_line_items" to "anon";

grant references on table "public"."quote_line_items" to "anon";

grant select on table "public"."quote_line_items" to "anon";

grant trigger on table "public"."quote_line_items" to "anon";

grant truncate on table "public"."quote_line_items" to "anon";

grant update on table "public"."quote_line_items" to "anon";

grant delete on table "public"."quote_line_items" to "authenticated";

grant insert on table "public"."quote_line_items" to "authenticated";

grant references on table "public"."quote_line_items" to "authenticated";

grant select on table "public"."quote_line_items" to "authenticated";

grant trigger on table "public"."quote_line_items" to "authenticated";

grant truncate on table "public"."quote_line_items" to "authenticated";

grant update on table "public"."quote_line_items" to "authenticated";

grant delete on table "public"."quote_line_items" to "service_role";

grant insert on table "public"."quote_line_items" to "service_role";

grant references on table "public"."quote_line_items" to "service_role";

grant select on table "public"."quote_line_items" to "service_role";

grant trigger on table "public"."quote_line_items" to "service_role";

grant truncate on table "public"."quote_line_items" to "service_role";

grant update on table "public"."quote_line_items" to "service_role";

grant delete on table "public"."quotes" to "anon";

grant insert on table "public"."quotes" to "anon";

grant references on table "public"."quotes" to "anon";

grant select on table "public"."quotes" to "anon";

grant trigger on table "public"."quotes" to "anon";

grant truncate on table "public"."quotes" to "anon";

grant update on table "public"."quotes" to "anon";

grant delete on table "public"."quotes" to "authenticated";

grant insert on table "public"."quotes" to "authenticated";

grant references on table "public"."quotes" to "authenticated";

grant select on table "public"."quotes" to "authenticated";

grant trigger on table "public"."quotes" to "authenticated";

grant truncate on table "public"."quotes" to "authenticated";

grant update on table "public"."quotes" to "authenticated";

grant delete on table "public"."quotes" to "service_role";

grant insert on table "public"."quotes" to "service_role";

grant references on table "public"."quotes" to "service_role";

grant select on table "public"."quotes" to "service_role";

grant trigger on table "public"."quotes" to "service_role";

grant truncate on table "public"."quotes" to "service_role";

grant update on table "public"."quotes" to "service_role";

grant delete on table "public"."scheduled_messages" to "anon";

grant insert on table "public"."scheduled_messages" to "anon";

grant references on table "public"."scheduled_messages" to "anon";

grant select on table "public"."scheduled_messages" to "anon";

grant trigger on table "public"."scheduled_messages" to "anon";

grant truncate on table "public"."scheduled_messages" to "anon";

grant update on table "public"."scheduled_messages" to "anon";

grant delete on table "public"."scheduled_messages" to "authenticated";

grant insert on table "public"."scheduled_messages" to "authenticated";

grant references on table "public"."scheduled_messages" to "authenticated";

grant select on table "public"."scheduled_messages" to "authenticated";

grant trigger on table "public"."scheduled_messages" to "authenticated";

grant truncate on table "public"."scheduled_messages" to "authenticated";

grant update on table "public"."scheduled_messages" to "authenticated";

grant delete on table "public"."scheduled_messages" to "service_role";

grant insert on table "public"."scheduled_messages" to "service_role";

grant references on table "public"."scheduled_messages" to "service_role";

grant select on table "public"."scheduled_messages" to "service_role";

grant trigger on table "public"."scheduled_messages" to "service_role";

grant truncate on table "public"."scheduled_messages" to "service_role";

grant update on table "public"."scheduled_messages" to "service_role";

grant delete on table "public"."supervisor_reports" to "anon";

grant insert on table "public"."supervisor_reports" to "anon";

grant references on table "public"."supervisor_reports" to "anon";

grant select on table "public"."supervisor_reports" to "anon";

grant trigger on table "public"."supervisor_reports" to "anon";

grant truncate on table "public"."supervisor_reports" to "anon";

grant update on table "public"."supervisor_reports" to "anon";

grant delete on table "public"."supervisor_reports" to "authenticated";

grant insert on table "public"."supervisor_reports" to "authenticated";

grant references on table "public"."supervisor_reports" to "authenticated";

grant select on table "public"."supervisor_reports" to "authenticated";

grant trigger on table "public"."supervisor_reports" to "authenticated";

grant truncate on table "public"."supervisor_reports" to "authenticated";

grant update on table "public"."supervisor_reports" to "authenticated";

grant delete on table "public"."supervisor_reports" to "service_role";

grant insert on table "public"."supervisor_reports" to "service_role";

grant references on table "public"."supervisor_reports" to "service_role";

grant select on table "public"."supervisor_reports" to "service_role";

grant trigger on table "public"."supervisor_reports" to "service_role";

grant truncate on table "public"."supervisor_reports" to "service_role";

grant update on table "public"."supervisor_reports" to "service_role";

grant delete on table "public"."suppliers" to "anon";

grant insert on table "public"."suppliers" to "anon";

grant references on table "public"."suppliers" to "anon";

grant select on table "public"."suppliers" to "anon";

grant trigger on table "public"."suppliers" to "anon";

grant truncate on table "public"."suppliers" to "anon";

grant update on table "public"."suppliers" to "anon";

grant delete on table "public"."suppliers" to "authenticated";

grant insert on table "public"."suppliers" to "authenticated";

grant references on table "public"."suppliers" to "authenticated";

grant select on table "public"."suppliers" to "authenticated";

grant trigger on table "public"."suppliers" to "authenticated";

grant truncate on table "public"."suppliers" to "authenticated";

grant update on table "public"."suppliers" to "authenticated";

grant delete on table "public"."suppliers" to "service_role";

grant insert on table "public"."suppliers" to "service_role";

grant references on table "public"."suppliers" to "service_role";

grant select on table "public"."suppliers" to "service_role";

grant trigger on table "public"."suppliers" to "service_role";

grant truncate on table "public"."suppliers" to "service_role";

grant update on table "public"."suppliers" to "service_role";

grant delete on table "public"."time_entries" to "anon";

grant insert on table "public"."time_entries" to "anon";

grant references on table "public"."time_entries" to "anon";

grant select on table "public"."time_entries" to "anon";

grant trigger on table "public"."time_entries" to "anon";

grant truncate on table "public"."time_entries" to "anon";

grant update on table "public"."time_entries" to "anon";

grant delete on table "public"."time_entries" to "authenticated";

grant insert on table "public"."time_entries" to "authenticated";

grant references on table "public"."time_entries" to "authenticated";

grant select on table "public"."time_entries" to "authenticated";

grant trigger on table "public"."time_entries" to "authenticated";

grant truncate on table "public"."time_entries" to "authenticated";

grant update on table "public"."time_entries" to "authenticated";

grant delete on table "public"."time_entries" to "service_role";

grant insert on table "public"."time_entries" to "service_role";

grant references on table "public"."time_entries" to "service_role";

grant select on table "public"."time_entries" to "service_role";

grant trigger on table "public"."time_entries" to "service_role";

grant truncate on table "public"."time_entries" to "service_role";

grant update on table "public"."time_entries" to "service_role";

create policy "own"
on "public"."appointments"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."audit_log"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."automation_rules"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."communications"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."contract_templates"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."contracts"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."customer_attachments"
as permissive
for all
to public
using ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.profile_id = auth.uid()))))
with check ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.profile_id = auth.uid()))));


create policy "own"
on "public"."customer_notes"
as permissive
for all
to public
using ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.profile_id = auth.uid()))))
with check ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.profile_id = auth.uid()))));


create policy "own"
on "public"."customer_timeline_events"
as permissive
for all
to public
using ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.profile_id = auth.uid()))))
with check ((customer_id IN ( SELECT customers.id
   FROM customers
  WHERE (customers.profile_id = auth.uid()))));


create policy "own"
on "public"."customers"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."documents"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."employees"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."equipment_assets"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."equipment_bookings"
as permissive
for all
to public
using ((asset_id IN ( SELECT equipment_assets.id
   FROM equipment_assets
  WHERE (equipment_assets.profile_id = auth.uid()))));


create policy "own"
on "public"."follow_up_sequence_steps"
as permissive
for all
to public
using ((sequence_id IN ( SELECT follow_up_sequences.id
   FROM follow_up_sequences
  WHERE (follow_up_sequences.profile_id = auth.uid()))));


create policy "own"
on "public"."follow_up_sequences"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."invoice_line_items"
as permissive
for all
to public
using ((invoice_id IN ( SELECT invoices.id
   FROM invoices
  WHERE (invoices.profile_id = auth.uid()))));


create policy "own"
on "public"."invoice_payments"
as permissive
for all
to public
using ((invoice_id IN ( SELECT invoices.id
   FROM invoices
  WHERE (invoices.profile_id = auth.uid()))));


create policy "own"
on "public"."invoices"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."material_catalog"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."message_templates"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."outreach_prospects"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."predefined_items"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."profiles"
as permissive
for all
to public
using ((auth.uid() = id));


create policy "own"
on "public"."project_timeline_milestones"
as permissive
for all
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.profile_id = auth.uid()))));


create policy "own"
on "public"."projects"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."quote_line_items"
as permissive
for all
to public
using ((quote_id IN ( SELECT quotes.id
   FROM quotes
  WHERE (quotes.profile_id = auth.uid()))));


create policy "own"
on "public"."quotes"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."scheduled_messages"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."supervisor_reports"
as permissive
for all
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.profile_id = auth.uid()))));


create policy "own"
on "public"."suppliers"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."time_entries"
as permissive
for all
to public
using ((employee_id IN ( SELECT employees.id
   FROM employees
  WHERE (employees.profile_id = auth.uid()))));



