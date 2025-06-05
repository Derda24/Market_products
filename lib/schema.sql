-- Price history table to track price changes over time
CREATE TABLE IF NOT EXISTS price_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    price DECIMAL(10,2) NOT NULL,
    store_id TEXT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_current BOOLEAN DEFAULT true
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_price_history_current ON price_history(is_current);

-- Function to update price history
CREATE OR REPLACE FUNCTION update_price_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark the previous current price as no longer current
    UPDATE price_history
    SET is_current = false,
        valid_until = CURRENT_TIMESTAMP
    WHERE product_id = NEW.id 
    AND is_current = true;

    -- Insert the new price
    INSERT INTO price_history (product_id, price, store_id)
    VALUES (NEW.id, NEW.price, NEW.store_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically track price changes
CREATE OR REPLACE TRIGGER track_price_changes
AFTER UPDATE OF price ON products
FOR EACH ROW
WHEN (OLD.price IS DISTINCT FROM NEW.price)
EXECUTE FUNCTION update_price_history(); 