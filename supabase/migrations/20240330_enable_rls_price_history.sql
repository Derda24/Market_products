-- Enable Row Level Security on price_history table
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Create policy for reading price history (allow public read access)
create policy "Allow public read access to price history"
    on public.price_history
    for select
    using (true);

-- Create policy for inserting price history (restrict to authenticated users)
create policy "Allow authenticated users to insert price history"
    on public.price_history
    for insert
    to authenticated
    with check (true);

-- Create policy for updating price history (restrict to authenticated users)
create policy "Allow authenticated users to update price history"
    on public.price_history
    for update
    to authenticated
    using (true)
    with check (true);

-- Create policy for deleting price history (restrict to authenticated users)
create policy "Allow authenticated users to delete price history"
    on public.price_history
    for delete
    to authenticated
    using (true);

-- Grant necessary permissions
grant select on public.price_history to anon, authenticated;
grant insert, update, delete on public.price_history to authenticated; 