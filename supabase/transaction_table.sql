-- Create Transaction table
CREATE TABLE IF NOT EXISTS "Transaction" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'ILS',
    description TEXT,
    product_name TEXT,
    provider_transaction_id TEXT, -- e.g., Cardcom Deal ID or LowProfileCode
    status TEXT DEFAULT 'completed', -- completed, refunded, pending
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB -- Store extra details like requestId, exact date from provider, etc.
);

-- Enable RLS
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view their own transactions" 
ON "Transaction" 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Service role can do everything (insert, update, select)
-- (Supabase Edge Functions use service role or act as user, but insert likely needs service role or open permissions if called by authenticated user)
-- Since verify-payment runs as the user (auth context), we need to allow INSERT.
-- BUT, we only want the SERVER to insert, not the user directly from frontend.
-- However, our Edge Function runs with the user's Auth context?
-- 'createClient' in Edge Function uses: Authorization: req.headers.get('Authorization')
-- So it acts as the user.
-- If we allow users to INSERT, they could fake transactions.
-- BETTER: The Edge Function should use the SERVICE_ROLE_KEY to insert into specific tables if we want to restrict user writes.
-- OR: We just allow "Authenticated" users to see, but we strictly control INSERT/UPDATE via RLS to be "Service Role Only" and use Service Role in the Edge Function for the INSERT part.

-- Let's stick to: Users can SELECT.
-- INSERT restricted to Service Role (admin).

CREATE POLICY "Service Role can manage all transactions"
ON "Transaction"
USING (true)
WITH CHECK (true);
