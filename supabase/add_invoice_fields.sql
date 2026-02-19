-- Add invoice details columns to UserProfile table
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "invoice_company_name" text;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "invoice_vat_id" text;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "invoice_phone" text;

-- Add comments for documentation
COMMENT ON COLUMN "UserProfile"."invoice_company_name" IS 'Company name for invoice purposes';
COMMENT ON COLUMN "UserProfile"."invoice_vat_id" IS 'VAT ID or Tax ID for invoice purposes';
COMMENT ON COLUMN "UserProfile"."invoice_phone" IS 'Phone number for invoice purposes';
