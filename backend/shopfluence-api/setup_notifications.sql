-- Trigger for Product Approved
CREATE OR REPLACE FUNCTION notify_brand_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_brand_owner_id UUID;
BEGIN
  IF OLD.status != 'ACTIVE' AND NEW.status = 'ACTIVE' THEN
    -- Get brand owner ID
    SELECT owner_id INTO v_brand_owner_id FROM brands WHERE id = NEW.brand_id;
    
    -- Insert notification for brand
    IF v_brand_owner_id IS NOT NULL THEN
       INSERT INTO notifications (id, user_id, type, title, message)
       VALUES (gen_random_uuid(), v_brand_owner_id, 'SYSTEM', 'Product Approved', 'Your product "' || NEW.name || '" has been approved by admins and is now live in the marketplace!');
    END IF;

    -- Insert notifications for all active affiliates 
    INSERT INTO notifications (id, user_id, type, title, message)
    SELECT gen_random_uuid(), id, 'SYSTEM', 'New Product Opportunity', 'A new product "' || NEW.name || '" was just added to the marketplace. Tap to check its commission margins and add it to your store!'
    FROM users WHERE role = 'AFFILIATE' AND status = 'ACTIVE';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_approved_trigger ON products;
CREATE TRIGGER product_approved_trigger
AFTER UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION notify_brand_on_approval();


-- Trigger for Commission Earned & Sales Received
CREATE OR REPLACE FUNCTION notify_on_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- New Commission Confirmed
  IF (TG_OP = 'INSERT' AND NEW.status = 'CONFIRMED') OR (TG_OP = 'UPDATE' AND OLD.status != 'CONFIRMED' AND NEW.status = 'CONFIRMED') THEN
    
    -- Affiliate notification 'Commission earned'
    INSERT INTO notifications (id, user_id, type, title, message)
    SELECT gen_random_uuid(), u.id, 'PAYMENT', 'Commission Earned! 🎉', 'You just earned ₹' || NEW.commission_amount || ' from a referral sale!'
    FROM influencer_profiles ip JOIN users u ON u.id = ip.user_id 
    WHERE ip.id = NEW.influencer_id;

    -- Brand notification 'Sales received'
    INSERT INTO notifications (id, user_id, type, title, message)
    SELECT DISTINCT gen_random_uuid(), b.owner_id, 'ORDER', 'New Affiliate Sale! 🛍️', 'An affiliate just generated a sale worth ₹' || NEW.order_amount || ' for your products!'
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN brands b ON b.id = p.brand_id
    WHERE oi.order_id = NEW.order_id AND b.owner_id IS NOT NULL;
    
  END IF;

  -- Payment Released
  IF TG_OP = 'UPDATE' AND OLD.status != 'PAID_OUT' AND NEW.status = 'PAID_OUT' THEN
    INSERT INTO notifications (id, user_id, type, title, message)
    SELECT gen_random_uuid(), u.id, 'PAYMENT', 'Payment Released 💸', 'Your commission of ₹' || NEW.commission_amount || ' has been successfully paid out to your linked account.'
    FROM influencer_profiles ip JOIN users u ON u.id = ip.user_id 
    WHERE ip.id = NEW.influencer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversion_trigger ON affiliate_conversions;
CREATE TRIGGER conversion_trigger
AFTER INSERT OR UPDATE ON affiliate_conversions
FOR EACH ROW EXECUTE FUNCTION notify_on_conversion();
