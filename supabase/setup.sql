-- Step 1: Create the products table
create table if not exists public.products (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    price numeric not null,
    category text,
    store_id text,
    quantity text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for products
create index if not exists idx_products_name on public.products(name);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_store_id on public.products(store_id);

-- Enable RLS for products
alter table public.products enable row level security;

-- Create a policy for products
create policy "Allow all operations for products"
    on public.products
    for all
    using (true)
    with check (true);

-- Grant access to products
grant all on public.products to authenticated, anon;

-- Step 2: Set up nutrition data
drop trigger if exists update_nutrition_data_updated_at on public.nutrition_data;
drop function if exists update_updated_at_column();
drop function if exists upsert_nutrition_data(uuid, text, integer);

create table if not exists public.nutrition_data (
    id uuid default uuid_generate_v4() primary key,
    product_id uuid references public.products(id),
    nutrition_score text,
    health_score integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_product_nutrition unique (product_id)
);

create index if not exists idx_nutrition_product_id on public.nutrition_data(product_id);
create index if not exists idx_nutrition_score on public.nutrition_data(nutrition_score);

create function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_nutrition_data_updated_at
    before update on public.nutrition_data
    for each row
    execute function update_updated_at_column();

create function upsert_nutrition_data(
    p_product_id uuid,
    p_nutrition_score text,
    p_health_score integer
) returns uuid as $$
begin
    insert into public.nutrition_data (
        product_id,
        nutrition_score,
        health_score
    )
    values (
        p_product_id,
        p_nutrition_score,
        p_health_score
    )
    on conflict (product_id)
    do update set
        nutrition_score = p_nutrition_score,
        health_score = p_health_score,
        updated_at = now();
    
    return p_product_id;
end;
$$ language plpgsql;

-- Enable RLS for nutrition data
alter table public.nutrition_data enable row level security;

create policy "Allow all operations for nutrition data"
    on public.nutrition_data
    for all
    using (true)
    with check (true);

grant all on public.nutrition_data to authenticated, anon;

-- Step 3: Insert sample data
-- Insert sample products
insert into public.products (name, price, category, store_id, quantity)
select * from (
    values 
    ('Olive Oil Extra Virgin', 5.99, 'Food', 'mercadona.es', '1L'),
    ('Fresh Milk', 1.29, 'Dairy', 'lidl.es', '1L'),
    ('White Bread', 0.99, 'Bakery', 'dia.es', '500g'),
    ('Bananas', 1.49, 'Fruits', 'carrefour.es', '1kg'),
    ('Chicken Breast', 6.99, 'Meat', 'mercadona.es', '500g'),
    ('Yogurt Natural', 0.89, 'Dairy', 'lidl.es', '125g x 4'),
    ('Tomatoes', 2.49, 'Vegetables', 'dia.es', '1kg'),
    ('Pasta Spaghetti', 1.19, 'Food', 'carrefour.es', '500g'),
    ('Orange Juice', 2.99, 'Beverages', 'mercadona.es', '1L'),
    ('Cheese Slices', 2.79, 'Dairy', 'lidl.es', '200g')
) as v(name, price, category, store_id, quantity)
where not exists (
    select 1 from public.products where name = v.name and store_id = v.store_id
);

-- Insert nutrition data for products
insert into public.nutrition_data (product_id, nutrition_score, health_score)
select 
    p.id,
    case 
        when p.category = 'Fruits' or p.category = 'Vegetables' then 'a'
        when p.category = 'Dairy' then 'b'
        when p.category = 'Meat' then 'c'
        when p.category = 'Bakery' then 'd'
        else 'c'
    end as nutrition_score,
    case 
        when p.category = 'Fruits' or p.category = 'Vegetables' then 95
        when p.category = 'Dairy' then 80
        when p.category = 'Meat' then 70
        when p.category = 'Bakery' then 60
        else 65
    end as health_score
from public.products p
where not exists (
    select 1 from public.nutrition_data where product_id = p.id
); 