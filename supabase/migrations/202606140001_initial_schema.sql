create extension if not exists "pgcrypto";

create type public.shop_status as enum ('draft', 'published', 'suspended');
create type public.product_status as enum ('draft', 'active', 'out_of_stock', 'archived');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name varchar(100),
  phone_e164 varchar(20),
  locale varchar(10) not null default 'fr-SN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_phone_format check (
    phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  )
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name varchar(100) not null,
  slug varchar(80) not null unique,
  description varchar(500),
  whatsapp_number varchar(20) not null,
  logo_path text,
  address varchar(200),
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  status public.shop_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shops_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint shops_whatsapp_format check (
    whatsapp_number ~ '^\+[1-9][0-9]{7,14}$'
  )
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name varchar(120) not null,
  slug varchar(120) not null,
  description varchar(1000),
  price_xof bigint not null,
  compare_at_price_xof bigint,
  reference varchar(50),
  status public.product_status not null default 'draft',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, slug),
  constraint products_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint products_price_positive check (price_xof >= 0),
  constraint products_compare_price_valid check (
    compare_at_price_xof is null or compare_at_price_xof >= price_xof
  ),
  constraint products_position_positive check (position >= 0)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null unique,
  width integer not null,
  height integer not null,
  byte_size integer not null,
  alt_text varchar(160),
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint product_images_width_valid check (width between 1 and 4096),
  constraint product_images_height_valid check (height between 1 and 4096),
  constraint product_images_size_valid check (byte_size between 1 and 500000),
  constraint product_images_position_valid check (position between 0 and 2),
  unique (product_id, position)
);

create index products_shop_status_position_idx
  on public.products (shop_id, status, position);
create index product_images_product_position_idx
  on public.product_images (product_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger shops_set_updated_at
before update on public.shops
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.shop_id::text, 0));

  if (
    select count(*)
    from public.products
    where shop_id = new.shop_id
      and status <> 'archived'
      and id <> new.id
  ) >= 30 then
    raise exception 'Une boutique ne peut pas avoir plus de 30 produits actifs au MVP.';
  end if;
  return new;
end;
$$;

create trigger products_enforce_limit
before insert or update of shop_id, status on public.products
for each row execute function public.enforce_product_limit();

create or replace function public.enforce_product_image_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.product_id::text, 0));

  if (
    select count(*)
    from public.product_images
    where product_id = new.product_id
  ) >= 3 then
    raise exception 'Un produit ne peut pas avoir plus de 3 images.';
  end if;
  return new;
end;
$$;

create trigger product_images_enforce_limit
before insert on public.product_images
for each row execute function public.enforce_product_image_limit();

alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

create policy "Users read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Published shops are public"
on public.shops for select
to anon, authenticated
using (status = 'published' or owner_id = (select auth.uid()));

create policy "Owners create their shop"
on public.shops for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "Owners update their shop"
on public.shops for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Owners delete their draft shop"
on public.shops for delete
to authenticated
using (owner_id = (select auth.uid()) and status = 'draft');

create policy "Active products of published shops are public"
on public.products for select
to anon, authenticated
using (
  (
    status in ('active', 'out_of_stock')
    and exists (
      select 1
      from public.shops
      where shops.id = products.shop_id
        and shops.status = 'published'
    )
  )
  or exists (
    select 1
    from public.shops
    where shops.id = products.shop_id
      and shops.owner_id = (select auth.uid())
  )
);

create policy "Owners create products"
on public.products for insert
to authenticated
with check (
  exists (
    select 1 from public.shops
    where shops.id = products.shop_id
      and shops.owner_id = (select auth.uid())
  )
);

create policy "Owners update products"
on public.products for update
to authenticated
using (
  exists (
    select 1 from public.shops
    where shops.id = products.shop_id
      and shops.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.shops
    where shops.id = products.shop_id
      and shops.owner_id = (select auth.uid())
  )
);

create policy "Owners delete products"
on public.products for delete
to authenticated
using (
  exists (
    select 1 from public.shops
    where shops.id = products.shop_id
      and shops.owner_id = (select auth.uid())
  )
);

create policy "Visible product images are public"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    join public.shops on shops.id = products.shop_id
    where products.id = product_images.product_id
      and (
        (
          products.status in ('active', 'out_of_stock')
          and shops.status = 'published'
        )
        or shops.owner_id = (select auth.uid())
      )
  )
);

create policy "Owners manage product images"
on public.product_images for all
to authenticated
using (
  exists (
    select 1
    from public.products
    join public.shops on shops.id = products.shop_id
    where products.id = product_images.product_id
      and shops.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.products
    join public.shops on shops.id = products.shop_id
    where products.id = product_images.product_id
      and shops.owner_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  500000,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

create policy "Public reads product image objects"
on storage.objects for select
to public
using (bucket_id = 'product-images');

create policy "Owners upload product image objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Owners update product image objects"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'product-images'
  and owner_id = (select auth.uid())::text
);

create policy "Owners delete product image objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and owner_id = (select auth.uid())::text
);
