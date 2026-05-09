create extension if not exists "pg_net" with schema "public" version '0.20.0';

drop policy "own" on "public"."time_entries";

create table "public"."campaign_sends" (
    "id" uuid not null default gen_random_uuid(),
    "campaign_id" uuid not null,
    "profile_id" uuid not null,
    "recipient_email" text not null,
    "recipient_name" text,
    "status" text not null default 'sent'::text,
    "error" text,
    "sent_at" timestamp with time zone default now()
);


alter table "public"."campaign_sends" enable row level security;

create table "public"."campaigns" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "name" text not null,
    "subject" text not null,
    "body" text not null,
    "audience_type" text not null default 'all_customers'::text,
    "audience_filters" jsonb default '{}'::jsonb,
    "status" text not null default 'draft'::text,
    "scheduled_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "total_recipients" integer default 0,
    "total_sent" integer default 0,
    "total_failed" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."campaigns" enable row level security;

create table "public"."social_posts" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "platform" text not null,
    "content" text not null,
    "hashtags" text[] default '{}'::text[],
    "status" text not null default 'draft'::text,
    "scheduled_date" date not null,
    "scheduled_time" time without time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."social_posts" enable row level security;

alter table "public"."projects" add column "gps_radius_meters" integer not null default 200;

alter table "public"."projects" add column "site_lat" double precision;

alter table "public"."projects" add column "site_lng" double precision;

alter table "public"."time_entries" add column "accuracy_meters" real;

alter table "public"."time_entries" add column "distance_meters" real;

alter table "public"."time_entries" add column "lat" double precision;

alter table "public"."time_entries" add column "lng" double precision;

alter table "public"."time_entries" add column "override_by" uuid;

alter table "public"."time_entries" add column "override_reason" text;

CREATE UNIQUE INDEX campaign_sends_pkey ON public.campaign_sends USING btree (id);

CREATE UNIQUE INDEX campaigns_pkey ON public.campaigns USING btree (id);

CREATE INDEX idx_time_entries_employee_active ON public.time_entries USING btree (employee_id) WHERE (clock_out_at IS NULL);

CREATE INDEX idx_time_entries_project_id ON public.time_entries USING btree (project_id);

CREATE UNIQUE INDEX social_posts_pkey ON public.social_posts USING btree (id);

alter table "public"."campaign_sends" add constraint "campaign_sends_pkey" PRIMARY KEY using index "campaign_sends_pkey";

alter table "public"."campaigns" add constraint "campaigns_pkey" PRIMARY KEY using index "campaigns_pkey";

alter table "public"."social_posts" add constraint "social_posts_pkey" PRIMARY KEY using index "social_posts_pkey";

alter table "public"."campaign_sends" add constraint "campaign_sends_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE not valid;

alter table "public"."campaign_sends" validate constraint "campaign_sends_campaign_id_fkey";

alter table "public"."campaign_sends" add constraint "campaign_sends_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."campaign_sends" validate constraint "campaign_sends_profile_id_fkey";

alter table "public"."campaigns" add constraint "campaigns_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."campaigns" validate constraint "campaigns_profile_id_fkey";

alter table "public"."social_posts" add constraint "social_posts_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."social_posts" validate constraint "social_posts_profile_id_fkey";

alter table "public"."time_entries" add constraint "time_entries_override_by_fkey" FOREIGN KEY (override_by) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."time_entries" validate constraint "time_entries_override_by_fkey";

grant delete on table "public"."campaign_sends" to "anon";

grant insert on table "public"."campaign_sends" to "anon";

grant references on table "public"."campaign_sends" to "anon";

grant select on table "public"."campaign_sends" to "anon";

grant trigger on table "public"."campaign_sends" to "anon";

grant truncate on table "public"."campaign_sends" to "anon";

grant update on table "public"."campaign_sends" to "anon";

grant delete on table "public"."campaign_sends" to "authenticated";

grant insert on table "public"."campaign_sends" to "authenticated";

grant references on table "public"."campaign_sends" to "authenticated";

grant select on table "public"."campaign_sends" to "authenticated";

grant trigger on table "public"."campaign_sends" to "authenticated";

grant truncate on table "public"."campaign_sends" to "authenticated";

grant update on table "public"."campaign_sends" to "authenticated";

grant delete on table "public"."campaign_sends" to "service_role";

grant insert on table "public"."campaign_sends" to "service_role";

grant references on table "public"."campaign_sends" to "service_role";

grant select on table "public"."campaign_sends" to "service_role";

grant trigger on table "public"."campaign_sends" to "service_role";

grant truncate on table "public"."campaign_sends" to "service_role";

grant update on table "public"."campaign_sends" to "service_role";

grant delete on table "public"."campaigns" to "anon";

grant insert on table "public"."campaigns" to "anon";

grant references on table "public"."campaigns" to "anon";

grant select on table "public"."campaigns" to "anon";

grant trigger on table "public"."campaigns" to "anon";

grant truncate on table "public"."campaigns" to "anon";

grant update on table "public"."campaigns" to "anon";

grant delete on table "public"."campaigns" to "authenticated";

grant insert on table "public"."campaigns" to "authenticated";

grant references on table "public"."campaigns" to "authenticated";

grant select on table "public"."campaigns" to "authenticated";

grant trigger on table "public"."campaigns" to "authenticated";

grant truncate on table "public"."campaigns" to "authenticated";

grant update on table "public"."campaigns" to "authenticated";

grant delete on table "public"."campaigns" to "service_role";

grant insert on table "public"."campaigns" to "service_role";

grant references on table "public"."campaigns" to "service_role";

grant select on table "public"."campaigns" to "service_role";

grant trigger on table "public"."campaigns" to "service_role";

grant truncate on table "public"."campaigns" to "service_role";

grant update on table "public"."campaigns" to "service_role";

grant delete on table "public"."social_posts" to "anon";

grant insert on table "public"."social_posts" to "anon";

grant references on table "public"."social_posts" to "anon";

grant select on table "public"."social_posts" to "anon";

grant trigger on table "public"."social_posts" to "anon";

grant truncate on table "public"."social_posts" to "anon";

grant update on table "public"."social_posts" to "anon";

grant delete on table "public"."social_posts" to "authenticated";

grant insert on table "public"."social_posts" to "authenticated";

grant references on table "public"."social_posts" to "authenticated";

grant select on table "public"."social_posts" to "authenticated";

grant trigger on table "public"."social_posts" to "authenticated";

grant truncate on table "public"."social_posts" to "authenticated";

grant update on table "public"."social_posts" to "authenticated";

grant delete on table "public"."social_posts" to "service_role";

grant insert on table "public"."social_posts" to "service_role";

grant references on table "public"."social_posts" to "service_role";

grant select on table "public"."social_posts" to "service_role";

grant trigger on table "public"."social_posts" to "service_role";

grant truncate on table "public"."social_posts" to "service_role";

grant update on table "public"."social_posts" to "service_role";

create policy "campaign_sends_owner"
on "public"."campaign_sends"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "campaigns_owner"
on "public"."campaigns"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "Users can insert own profile"
on "public"."profiles"
as permissive
for insert
to authenticated
with check ((id = auth.uid()));


create policy "Users can update own profile"
on "public"."profiles"
as permissive
for update
to authenticated
using ((id = auth.uid()))
with check ((id = auth.uid()));


create policy "Users can view own profile"
on "public"."profiles"
as permissive
for select
to authenticated
using ((id = auth.uid()));


create policy "social_posts_owner"
on "public"."social_posts"
as permissive
for all
to public
using ((profile_id = auth.uid()));


create policy "own"
on "public"."time_entries"
as permissive
for all
to public
using (((employee_id IN ( SELECT employees.id
   FROM employees
  WHERE (employees.profile_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['owner'::text, 'supervisor'::text, 'admin'::text])))))));



