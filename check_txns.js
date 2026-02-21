import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLastTransactions() {
  console.log('Fetching last 5 transactions...');
  const { data, error } = await supabase
    .from('Transaction')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching transactions:', error);
    return;
  }

  data.forEach(tx => {
    console.log(`\nID: ${tx.id}`);
    console.log(`Status: ${tx.status}`);
    console.log(`Amount: ${tx.amount}`);
    console.log(`Metadata: ${JSON.stringify(tx.metadata, null, 2)}`);
  });
}

checkLastTransactions();
