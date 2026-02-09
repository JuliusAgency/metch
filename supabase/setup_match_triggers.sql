-- Trigger for Job Update/Insert -> process-new-job
CREATE OR REPLACE FUNCTION trigger_process_new_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status is active (or changed to active)
  IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'active' AND (OLD.status != 'active' OR NEW.updated_date != OLD.updated_date)) THEN
     
     PERFORM net.http_post(
        url := 'https://xjnsbxebzyluqkdovlrk.supabase.co/functions/v1/process-new-job',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbnNieGVienlsdXFrZG92bHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMDg4NTMsImV4cCI6MjA3Njc4NDg1M30.Rn6FZixi5wmnaGZy-Reb6zfgKo0nHwjO2VApec88uk8"}'::jsonb,
        body := jsonb_build_object('record', row_to_json(NEW))
    );
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_job_update_match ON "Job";
CREATE TRIGGER on_job_update_match
  AFTER INSERT OR UPDATE ON "Job"
  FOR EACH ROW EXECUTE FUNCTION trigger_process_new_job();


-- Trigger for UserProfile Update -> process-candidate-update
CREATE OR REPLACE FUNCTION trigger_process_candidate_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for job seekers and if relevant fields changed
  IF NEW.user_type = 'job_seeker' AND (
     TG_OP = 'INSERT' OR
     NEW.specialization != OLD.specialization OR
     NEW.profession != OLD.profession OR
     NEW.character_traits != OLD.character_traits OR
     NEW.availability != OLD.availability OR
     NEW.preferred_location != OLD.preferred_location
  ) THEN

     PERFORM net.http_post(
        url := 'https://xjnsbxebzyluqkdovlrk.supabase.co/functions/v1/process-candidate-update',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbnNieGVienlsdXFrZG92bHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMDg4NTMsImV4cCI6MjA3Njc4NDg1M30.Rn6FZixi5wmnaGZy-Reb6zfgKo0nHwjO2VApec88uk8"}'::jsonb,
        body := jsonb_build_object('record', row_to_json(NEW))
    );
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_candidate_update_match ON "UserProfile";
CREATE TRIGGER on_candidate_update_match
  AFTER INSERT OR UPDATE ON "UserProfile"
  FOR EACH ROW EXECUTE FUNCTION trigger_process_candidate_update();
