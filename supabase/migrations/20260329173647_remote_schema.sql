alter table "public"."communications" add column "contact_type" text default 'customer'::text;

alter table "public"."communications" add column "prospect_id" text;

alter table "public"."profiles" add column "smtp_email" text;

alter table "public"."profiles" add column "smtp_from_name" text;

alter table "public"."profiles" add column "smtp_host" text;

alter table "public"."profiles" add column "smtp_password" text;

alter table "public"."profiles" add column "smtp_port" integer default 587;


