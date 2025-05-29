-- Insert sample products if they don't exist
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

-- Add some sample nutrition data
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