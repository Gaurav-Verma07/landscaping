create extension if not exists "pg_net" with schema "public" version '0.20.0';

create table "public"."design_plants" (
    "id" uuid not null default gen_random_uuid(),
    "design_id" uuid not null,
    "zone_id" uuid,
    "plant_catalog_id" uuid,
    "x" numeric(10,2) not null default 0,
    "y" numeric(10,2) not null default 0,
    "quantity" integer not null default 1,
    "spacing_ft" numeric(6,2) not null default 2,
    "rotation" numeric(6,2) not null default 0,
    "scale_multiplier" numeric(6,2) not null default 1,
    "common_name" text not null default ''::text,
    "plant_type" text not null default 'shrub'::text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."design_plants" enable row level security;

create table "public"."design_zones" (
    "id" uuid not null default gen_random_uuid(),
    "design_id" uuid not null,
    "name" text not null default 'Zone'::text,
    "zone_type" text not null default 'planting_bed'::text,
    "fill_material" text not null default ''::text,
    "area_sqft" numeric(10,2) not null default 0,
    "polygon_points" jsonb not null default '[]'::jsonb,
    "color_override" text,
    "notes" text not null default ''::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."design_zones" enable row level security;

create table "public"."landscape_designs" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "customer_id" uuid not null,
    "project_id" uuid,
    "name" text not null,
    "status" text not null default 'draft'::text,
    "canvas_state" jsonb not null default '{}'::jsonb,
    "thumbnail_url" text,
    "total_area_sqft" numeric(10,2) not null default 0,
    "notes" text not null default ''::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."landscape_designs" enable row level security;

create table "public"."plant_catalog" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid,
    "org_id" uuid,
    "common_name" text not null,
    "botanical_name" text not null default ''::text,
    "plant_type" text not null,
    "sun_requirement" text not null,
    "water_need" text not null,
    "mature_height_ft" numeric(6,2) not null default 0,
    "mature_spread_ft" numeric(6,2) not null default 0,
    "hardiness_zones" text[] not null default '{}'::text[],
    "icon_url" text,
    "thumbnail_url" text,
    "notes" text not null default ''::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."plant_catalog" enable row level security;

CREATE UNIQUE INDEX design_plants_pkey ON public.design_plants USING btree (id);

CREATE UNIQUE INDEX design_zones_pkey ON public.design_zones USING btree (id);

CREATE INDEX idx_design_plants_design ON public.design_plants USING btree (design_id);

CREATE INDEX idx_design_plants_zone ON public.design_plants USING btree (zone_id);

CREATE INDEX idx_design_zones_design ON public.design_zones USING btree (design_id);

CREATE INDEX idx_landscape_designs_customer ON public.landscape_designs USING btree (customer_id);

CREATE INDEX idx_landscape_designs_profile ON public.landscape_designs USING btree (profile_id);

CREATE INDEX idx_landscape_designs_project ON public.landscape_designs USING btree (project_id);

CREATE INDEX idx_plant_catalog_profile ON public.plant_catalog USING btree (profile_id);

CREATE INDEX idx_plant_catalog_sun ON public.plant_catalog USING btree (sun_requirement);

CREATE INDEX idx_plant_catalog_type ON public.plant_catalog USING btree (plant_type);

CREATE INDEX idx_plant_catalog_water ON public.plant_catalog USING btree (water_need);

CREATE UNIQUE INDEX landscape_designs_pkey ON public.landscape_designs USING btree (id);

CREATE UNIQUE INDEX plant_catalog_common_name_botanical_name_key ON public.plant_catalog USING btree (common_name, botanical_name);

CREATE UNIQUE INDEX plant_catalog_pkey ON public.plant_catalog USING btree (id);

alter table "public"."design_plants" add constraint "design_plants_pkey" PRIMARY KEY using index "design_plants_pkey";

alter table "public"."design_zones" add constraint "design_zones_pkey" PRIMARY KEY using index "design_zones_pkey";

alter table "public"."landscape_designs" add constraint "landscape_designs_pkey" PRIMARY KEY using index "landscape_designs_pkey";

alter table "public"."plant_catalog" add constraint "plant_catalog_pkey" PRIMARY KEY using index "plant_catalog_pkey";

alter table "public"."design_plants" add constraint "design_plants_design_id_fkey" FOREIGN KEY (design_id) REFERENCES landscape_designs(id) ON DELETE CASCADE not valid;

alter table "public"."design_plants" validate constraint "design_plants_design_id_fkey";

alter table "public"."design_plants" add constraint "design_plants_plant_catalog_id_fkey" FOREIGN KEY (plant_catalog_id) REFERENCES plant_catalog(id) ON DELETE RESTRICT not valid;

alter table "public"."design_plants" validate constraint "design_plants_plant_catalog_id_fkey";

alter table "public"."design_plants" add constraint "design_plants_zone_id_fkey" FOREIGN KEY (zone_id) REFERENCES design_zones(id) ON DELETE SET NULL not valid;

alter table "public"."design_plants" validate constraint "design_plants_zone_id_fkey";

alter table "public"."design_zones" add constraint "design_zones_design_id_fkey" FOREIGN KEY (design_id) REFERENCES landscape_designs(id) ON DELETE CASCADE not valid;

alter table "public"."design_zones" validate constraint "design_zones_design_id_fkey";

alter table "public"."design_zones" add constraint "design_zones_zone_type_check" CHECK ((zone_type = ANY (ARRAY['lawn'::text, 'planting_bed'::text, 'hardscape'::text, 'water'::text, 'edging'::text, 'mulch'::text, 'gravel'::text, 'other'::text]))) not valid;

alter table "public"."design_zones" validate constraint "design_zones_zone_type_check";

alter table "public"."landscape_designs" add constraint "landscape_designs_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE not valid;

alter table "public"."landscape_designs" validate constraint "landscape_designs_customer_id_fkey";

alter table "public"."landscape_designs" add constraint "landscape_designs_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."landscape_designs" validate constraint "landscape_designs_profile_id_fkey";

alter table "public"."landscape_designs" add constraint "landscape_designs_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL not valid;

alter table "public"."landscape_designs" validate constraint "landscape_designs_project_id_fkey";

alter table "public"."landscape_designs" add constraint "landscape_designs_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'shared'::text, 'approved'::text, 'archived'::text]))) not valid;

alter table "public"."landscape_designs" validate constraint "landscape_designs_status_check";

alter table "public"."plant_catalog" add constraint "plant_catalog_common_name_botanical_name_key" UNIQUE using index "plant_catalog_common_name_botanical_name_key";

alter table "public"."plant_catalog" add constraint "plant_catalog_plant_type_check" CHECK ((plant_type = ANY (ARRAY['tree'::text, 'shrub'::text, 'perennial'::text, 'annual'::text, 'groundcover'::text, 'grass'::text, 'vine'::text, 'succulent'::text, 'fern'::text, 'bulb'::text]))) not valid;

alter table "public"."plant_catalog" validate constraint "plant_catalog_plant_type_check";

alter table "public"."plant_catalog" add constraint "plant_catalog_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."plant_catalog" validate constraint "plant_catalog_profile_id_fkey";

alter table "public"."plant_catalog" add constraint "plant_catalog_sun_requirement_check" CHECK ((sun_requirement = ANY (ARRAY['full_sun'::text, 'part_shade'::text, 'full_shade'::text]))) not valid;

alter table "public"."plant_catalog" validate constraint "plant_catalog_sun_requirement_check";

alter table "public"."plant_catalog" add constraint "plant_catalog_water_need_check" CHECK ((water_need = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))) not valid;

alter table "public"."plant_catalog" validate constraint "plant_catalog_water_need_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."design_plants" to "anon";

grant insert on table "public"."design_plants" to "anon";

grant references on table "public"."design_plants" to "anon";

grant select on table "public"."design_plants" to "anon";

grant trigger on table "public"."design_plants" to "anon";

grant truncate on table "public"."design_plants" to "anon";

grant update on table "public"."design_plants" to "anon";

grant delete on table "public"."design_plants" to "authenticated";

grant insert on table "public"."design_plants" to "authenticated";

grant references on table "public"."design_plants" to "authenticated";

grant select on table "public"."design_plants" to "authenticated";

grant trigger on table "public"."design_plants" to "authenticated";

grant truncate on table "public"."design_plants" to "authenticated";

grant update on table "public"."design_plants" to "authenticated";

grant delete on table "public"."design_plants" to "service_role";

grant insert on table "public"."design_plants" to "service_role";

grant references on table "public"."design_plants" to "service_role";

grant select on table "public"."design_plants" to "service_role";

grant trigger on table "public"."design_plants" to "service_role";

grant truncate on table "public"."design_plants" to "service_role";

grant update on table "public"."design_plants" to "service_role";

grant delete on table "public"."design_zones" to "anon";

grant insert on table "public"."design_zones" to "anon";

grant references on table "public"."design_zones" to "anon";

grant select on table "public"."design_zones" to "anon";

grant trigger on table "public"."design_zones" to "anon";

grant truncate on table "public"."design_zones" to "anon";

grant update on table "public"."design_zones" to "anon";

grant delete on table "public"."design_zones" to "authenticated";

grant insert on table "public"."design_zones" to "authenticated";

grant references on table "public"."design_zones" to "authenticated";

grant select on table "public"."design_zones" to "authenticated";

grant trigger on table "public"."design_zones" to "authenticated";

grant truncate on table "public"."design_zones" to "authenticated";

grant update on table "public"."design_zones" to "authenticated";

grant delete on table "public"."design_zones" to "service_role";

grant insert on table "public"."design_zones" to "service_role";

grant references on table "public"."design_zones" to "service_role";

grant select on table "public"."design_zones" to "service_role";

grant trigger on table "public"."design_zones" to "service_role";

grant truncate on table "public"."design_zones" to "service_role";

grant update on table "public"."design_zones" to "service_role";

grant delete on table "public"."landscape_designs" to "anon";

grant insert on table "public"."landscape_designs" to "anon";

grant references on table "public"."landscape_designs" to "anon";

grant select on table "public"."landscape_designs" to "anon";

grant trigger on table "public"."landscape_designs" to "anon";

grant truncate on table "public"."landscape_designs" to "anon";

grant update on table "public"."landscape_designs" to "anon";

grant delete on table "public"."landscape_designs" to "authenticated";

grant insert on table "public"."landscape_designs" to "authenticated";

grant references on table "public"."landscape_designs" to "authenticated";

grant select on table "public"."landscape_designs" to "authenticated";

grant trigger on table "public"."landscape_designs" to "authenticated";

grant truncate on table "public"."landscape_designs" to "authenticated";

grant update on table "public"."landscape_designs" to "authenticated";

grant delete on table "public"."landscape_designs" to "service_role";

grant insert on table "public"."landscape_designs" to "service_role";

grant references on table "public"."landscape_designs" to "service_role";

grant select on table "public"."landscape_designs" to "service_role";

grant trigger on table "public"."landscape_designs" to "service_role";

grant truncate on table "public"."landscape_designs" to "service_role";

grant update on table "public"."landscape_designs" to "service_role";

grant delete on table "public"."plant_catalog" to "anon";

grant insert on table "public"."plant_catalog" to "anon";

grant references on table "public"."plant_catalog" to "anon";

grant select on table "public"."plant_catalog" to "anon";

grant trigger on table "public"."plant_catalog" to "anon";

grant truncate on table "public"."plant_catalog" to "anon";

grant update on table "public"."plant_catalog" to "anon";

grant delete on table "public"."plant_catalog" to "authenticated";

grant insert on table "public"."plant_catalog" to "authenticated";

grant references on table "public"."plant_catalog" to "authenticated";

grant select on table "public"."plant_catalog" to "authenticated";

grant trigger on table "public"."plant_catalog" to "authenticated";

grant truncate on table "public"."plant_catalog" to "authenticated";

grant update on table "public"."plant_catalog" to "authenticated";

grant delete on table "public"."plant_catalog" to "service_role";

grant insert on table "public"."plant_catalog" to "service_role";

grant references on table "public"."plant_catalog" to "service_role";

grant select on table "public"."plant_catalog" to "service_role";

grant trigger on table "public"."plant_catalog" to "service_role";

grant truncate on table "public"."plant_catalog" to "service_role";

grant update on table "public"."plant_catalog" to "service_role";

create policy "design_plant_owner"
on "public"."design_plants"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM landscape_designs d
  WHERE ((d.id = design_plants.design_id) AND (d.profile_id = auth.uid())))));


create policy "design_zone_owner"
on "public"."design_zones"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM landscape_designs d
  WHERE ((d.id = design_zones.design_id) AND (d.profile_id = auth.uid())))));


create policy "design_owner"
on "public"."landscape_designs"
as permissive
for all
to public
using ((auth.uid() = profile_id));


create policy "plant_catalog_delete"
on "public"."plant_catalog"
as permissive
for delete
to public
using ((profile_id = auth.uid()));


create policy "plant_catalog_read"
on "public"."plant_catalog"
as permissive
for select
to public
using (((org_id IS NULL) OR (profile_id = auth.uid())));


create policy "plant_catalog_update"
on "public"."plant_catalog"
as permissive
for update
to public
using (((profile_id = auth.uid()) OR (profile_id IS NULL)))
with check (((profile_id = auth.uid()) OR (profile_id IS NULL)));


create policy "plant_catalog_write"
on "public"."plant_catalog"
as permissive
for insert
to public
with check ((profile_id = auth.uid()));


CREATE TRIGGER trg_design_zones_updated_at BEFORE UPDATE ON public.design_zones FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_landscape_designs_updated_at BEFORE UPDATE ON public.landscape_designs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_plant_catalog_updated_at BEFORE UPDATE ON public.plant_catalog FOR EACH ROW EXECUTE FUNCTION set_updated_at();


