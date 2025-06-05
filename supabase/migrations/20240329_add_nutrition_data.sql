-- Drop existing objects if they exist
drop trigger if exists update_nutrition_data_updated_at on public.nutrition_data;
drop function if exists update_updated_at_column();
drop function if exists upsert_nutrition_data(uuid, text, integer);

-- Create the nutrition_data table if it doesn't exist
create table if not exists public.nutrition_data (
    id uuid default uuid_generate_v4() primary key,
    product_id uuid references public.products(id),
    nutrition_score text,
    health_score integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_product_nutrition unique (product_id)
);

-- Add indexes for better performance
create index if not exists idx_nutrition_product_id on public.nutrition_data(product_id);
create index if not exists idx_nutrition_score on public.nutrition_data(nutrition_score);

-- Create a function to update the updated_at timestamp
create function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create a trigger to automatically update the updated_at column
create trigger update_nutrition_data_updated_at
    before update on public.nutrition_data
    for each row
    execute function update_updated_at_column();

-- Add a function to update or insert nutrition data
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

-- Enable RLS but allow all operations for now
alter table public.nutrition_data enable row level security;

-- Create a policy that allows all operations
create policy "Allow all operations for nutrition data"
    on public.nutrition_data
    for all
    using (true)
    with check (true);

-- Grant access to authenticated and anon users
grant all on public.nutrition_data to authenticated, anon; 