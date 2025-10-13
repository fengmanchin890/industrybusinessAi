-- Seed demo sales data for the last 30 days (F&B)
-- Replace the company_id in the vars CTE if needed

WITH vars AS (
  SELECT '7de1d644-d548-4a14-98f4-d5995c072bc6'::uuid AS company_id
),
days AS (
  SELECT generate_series((current_date - interval '29 days')::date, current_date::date, interval '1 day')::date AS d
),
items AS (
  -- name + unit price mapping used to compute amount
  SELECT * FROM (
    VALUES
      ('珍珠奶茶', 65),
      ('雞排飯', 85),
      ('牛肉麵', 120)
  ) AS t(item_name, unit_price)
),
sales AS (
  SELECT
    v.company_id,
    d.d AS sold_at,
    i.item_name,
    -- Base demand per item with weekend/holiday uplift and small noise
    GREATEST(
      1,
      ROUND(
        (
          CASE i.item_name
            WHEN '珍珠奶茶' THEN 5
            WHEN '雞排飯' THEN 3
            ELSE 2
          END
        ) * (
          CASE EXTRACT(DOW FROM d.d)
            WHEN 5 THEN 1.6  -- Friday
            WHEN 6 THEN 1.6  -- Saturday
            WHEN 0 THEN 1.3  -- Sunday
            ELSE 1.0
          END
        )
        + (random() * 2 - 1) -- noise
      )
    )::int AS quantity,
    i.unit_price
  FROM days d
  CROSS JOIN items i
  CROSS JOIN vars v
)
INSERT INTO public.sales_transactions (company_id, sold_at, item_name, quantity, amount)
SELECT
  company_id,
  sold_at,
  item_name,
  quantity,
  (quantity * unit_price)::numeric
FROM sales;

-- Verify
-- SELECT sold_at, item_name, quantity, amount
-- FROM public.sales_transactions
-- WHERE company_id = '7de1d644-d548-4a14-98f4-d5995c072bc6'
-- ORDER BY sold_at DESC, item_name
-- LIMIT 20;


