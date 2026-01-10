BEGIN;

-- הסרת כל האילוצים שהוספנו לאחרונה כדי לשחרר את החסימה
-- UserProfile
ALTER TABLE "UserProfile" DROP CONSTRAINT IF EXISTS userprofile_id_fkey;

-- Conversation
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS conversation_employer_id_fkey;
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS conversation_candidate_id_fkey;

-- Message
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS message_sender_id_fkey;
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS message_recipient_id_fkey;

-- Job
ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS job_employer_id_fkey;

-- JobApplication
ALTER TABLE "JobApplication" DROP CONSTRAINT IF EXISTS jobapplication_applicant_id_fkey;

-- UserStats
ALTER TABLE "UserStats" DROP CONSTRAINT IF EXISTS userstats_user_id_fkey;

-- UserAction
ALTER TABLE "UserAction" DROP CONSTRAINT IF EXISTS useraction_user_id_fkey;

-- Notification
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS notification_user_id_fkey;

-- CV
ALTER TABLE "CV" DROP CONSTRAINT IF EXISTS cv_user_id_fkey;

-- QuestionnaireResponse
ALTER TABLE "QuestionnaireResponse" DROP CONSTRAINT IF EXISTS questionnaireresponse_user_id_fkey;

-- JobView & CandidateView
ALTER TABLE "JobView" DROP CONSTRAINT IF EXISTS jobview_viewer_id_fkey;
ALTER TABLE "CandidateView" DROP CONSTRAINT IF EXISTS candidateview_candidate_id_fkey;
ALTER TABLE "CandidateView" DROP CONSTRAINT IF EXISTS candidateview_viewer_id_fkey;

COMMIT;
