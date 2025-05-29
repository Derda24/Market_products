-- Create the product_images table if it doesn't exist
create table if not exists public.product_images (
    id uuid default uuid_generate_v4() primary key,
    product_name text not null,
    image_url text not null,
    category text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_fallback boolean default false
);

-- Create an index for faster lookups
create index if not exists product_images_product_name_idx on public.product_images(product_name);

-- Create the stored procedure for table creation
create or replace function public.create_product_images_table()
returns void
language plpgsql
security definer
as $$
begin
    -- Create the table if it doesn't exist
    create table if not exists public.product_images (
        id uuid default uuid_generate_v4() primary key,
        product_name text not null,
        image_url text not null,
        category text,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null,
        is_fallback boolean default false
    );

    -- Create an index for faster lookups
    create index if not exists product_images_product_name_idx on public.product_images(product_name);
end;
$$; 