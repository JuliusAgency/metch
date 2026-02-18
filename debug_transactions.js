
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parser
const envContent = fs.readFileSync('.env', 'utf-8');
const envConfig = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envConfig[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  console.log('Found keys:', Object.keys(envConfig));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchRecentTransactions() {
  console.log('Fetching last 5 transactions...');
  const { data, error } = await supabase
    .from('Transaction')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching transactions:', error);
  } else {
    // Check if any recent transaction (last 1 hour)
    const recent = data.filter(t => new Date(t.created_at) > new Date(Date.now() - 3600000));
    console.log('--- RECENT TRANSACTIONS (Last 1 Hour) ---');
    console.log(JSON.stringify(recent, null, 2));
    
    console.log('--- ALL LAST 5 TRANSACTIONS ---');
    console.log(JSON.stringify(data, null, 2));
  }
}

fetchRecentTransactions();
