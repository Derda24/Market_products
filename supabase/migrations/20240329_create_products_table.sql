-- Create the products table if it doesn't exist
create table if not exists public.products (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    price numeric not null,
    category text,
    store_id text,
    quantity text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for better performance
create index if not exists idx_products_name on public.products(name);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_store_id on public.products(store_id);

-- Enable Row Level Security but allow all operations for now
alter table public.products enable row level security;

-- Create a policy that allows all operations
create policy "Allow all operations for now"
    on public.products
    for all
    using (true)
    with check (true);

-- Grant access to authenticated and anon users
grant all on public.products to authenticated, anon;

-- Insert sample products if they don't exist
insert into public.products (name, price, category, store_id, quantity)
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
on conflict (id) do nothing; 