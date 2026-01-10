import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

async function main() {
  console.log('Reading .env file...');
  let env;
  try {
    env = fs.readFileSync('.env', 'utf8');
  } catch (e) {
    console.error('Could not read .env file.');
    return;
  }

  const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/); // Try anon first, might need service role
  // Actually, for storage deletion of OTHER users, we might need service_role logic if RLS prevents it.
  // But let's verify if we can list files first. 

  // If the user has a service role key in env, that would be better. Searching for it.
  const serviceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

  let key = keyMatch[1].trim();
  let supabaseUrl = urlMatch[1].trim();
  
  // If we have a service role key (unlikely in client-side env but possible), use it.
  if (serviceKeyMatch) {
      console.log('Using Service Role Key for admin privileges...');
      key = serviceKeyMatch[1].trim();
  } else {
      console.log('Using Anon Key. Note: Depending on RLS, this might safeguard against deleting other users files.');
  }

  const supabase = createClient(supabaseUrl, key);
  const targetEmail = 'netanelnagosa11@gmail.com';
  
  console.log(`Searching for user ID for email: ${targetEmail}`);
  
  // We can't query auth.users directly with anon key usually. But we can query UserProfile.
  const { data: profiles, error: profileError } = await supabase
    .from('UserProfile')
    .select('id, profile_picture, resume_url')
    .eq('email', targetEmail);

  if (profileError || !profiles || profiles.length === 0) {
      console.log('Could not find user profile in public table. They might be partially deleted.');
      console.log('Please find the User UUID from the Supabase Dashboard URL and enter it manually in the code if needed.');
      return; 
  }

  const userId = profiles[0].id;
  console.log(`Found User ID: ${userId}`);
  console.log('Profile Data:', profiles[0]);

  // 1. Delete Profile Image
  if (profiles[0].profile_picture) {
      const path = profiles[0].profile_picture.split('/').pop().split('?')[0]; // Extract filename roughly
      // Actually often stored as full path or needs parsing.
      // Let's try listing the bucket instead.
      console.log('Listing profile-images bucket...');
      const { data: files, error: listError } = await supabase.storage.from('profile-images').list(userId); // Often stored in folder by user ID
      
      if (files && files.length > 0) {
          console.log(`Found ${files.length} files in profile-images/${userId}`);
          const paths = files.map(f => `${userId}/${f.name}`);
          const { error: delError } = await supabase.storage.from('profile-images').remove(paths);
          if (delError) console.error('Error deleting profile images:', delError);
          else console.log('Deleted profile images successfully.');
      } else {
           // Try identifying by filename if not in folder
           console.log('No folder found. Attempting to match by known URL if possible...');
           // Logic depends on how you save files. Assuming folder structure based on typical patterns.
      }
  }

  // 2. Delete CVs
  // Check 'resumes' or 'cvs' bucket
  const buckets = ['cvs', 'resumes', 'documents'];
  for (const bucket of buckets) {
      console.log(`Checking bucket: ${bucket} for folder ${userId}...`);
      const { data: files } = await supabase.storage.from(bucket).list(userId);
      if (files && files.length > 0) {
          console.log(`Found ${files.length} files in ${bucket}/${userId}`);
          const paths = files.map(f => `${userId}/${f.name}`);
          const { error: delError } = await supabase.storage.from(bucket).remove(paths);
          if (delError) console.error(`Error deleting from ${bucket}:`, delError);
          else console.log(`Deleted files from ${bucket} successfully.`);
      }
  }
  
  console.log('Cleanup check complete. Try deleting user in dashboard now.');
}

main().catch(console.error);
