ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS deposit_id uuid REFERENCES deposits(id);
