export const schema = [
`CREATE TABLE IF NOT EXISTS shop_users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text UNIQUE NOT NULL, password_hash text NOT NULL, is_admin boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now())`,
`CREATE TABLE IF NOT EXISTS shop_sessions (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL)`,
`CREATE TABLE IF NOT EXISTS shop_products (id uuid PRIMARY KEY, data jsonb NOT NULL, stock integer NOT NULL CHECK (stock >= 0), created_at timestamptz NOT NULL DEFAULT now())`,
`CREATE TABLE IF NOT EXISTS shop_orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES shop_users(id), data jsonb NOT NULL, request_key uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, request_key))`,
`CREATE TABLE IF NOT EXISTS shop_reviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE, rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5), comment text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(product_id,user_id))`,
`CREATE TABLE IF NOT EXISTS shop_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL)`,
`CREATE INDEX IF NOT EXISTS shop_orders_user ON shop_orders(user_id,created_at DESC)`,
`CREATE INDEX IF NOT EXISTS shop_sessions_expiry ON shop_sessions(expires_at)`,
`CREATE OR REPLACE FUNCTION shop_checkout(uid uuid, items jsonb, shipping jsonb, request_id uuid) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE line jsonb; prod shop_products%ROWTYPE; existing shop_orders%ROWTYPE; result jsonb; order_id uuid; item_list jsonb := '[]'::jsonb; cents bigint := 0; freight bigint; tax bigint; qty integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text || request_id::text, 0));
 SELECT * INTO existing FROM shop_orders WHERE user_id=uid AND request_key=request_id;
 IF FOUND THEN RETURN existing.data || jsonb_build_object('_id',existing.id,'createdAt',existing.created_at); END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(items) ORDER BY value->>'_id' LOOP
  qty := (line->>'qty')::integer;
  IF qty < 1 OR qty > 20 THEN RAISE EXCEPTION 'INVALID_QUANTITY'; END IF;
  SELECT * INTO prod FROM shop_products WHERE id=(line->>'_id')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND'; END IF;
  IF prod.stock < qty THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;
  cents := cents + round((prod.data->>'price')::numeric*100)::bigint * qty;
  item_list := item_list || jsonb_build_array(jsonb_build_object('product',prod.id,'name',prod.data->>'name','image',prod.data->>'image','price',(prod.data->>'price')::numeric,'qty',qty));
  UPDATE shop_products SET stock=stock-qty WHERE id=prod.id;
 END LOOP;
 freight := CASE WHEN cents > 50000 THEN 0 ELSE 1000 END; tax := round(cents*.15);
 result := jsonb_build_object('orderItems',item_list,'shippingAddress',shipping,'paymentMethod','Demo','itemsPrice',cents/100.0,'shippingPrice',freight/100.0,'taxPrice',tax/100.0,'totalPrice',(cents+freight+tax)/100.0,'isPaid',false,'demoCompleted',false,'isDelivered',false);
 INSERT INTO shop_orders(user_id,data,request_key) VALUES(uid,result,request_id) RETURNING id INTO order_id;
 RETURN result || jsonb_build_object('_id',order_id,'createdAt',now());
END $$`
];
