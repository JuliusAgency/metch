BEGIN;

-- שיחה (Conversation) - מחיקת כל הגרסאות האפשריות של האילוצים
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_employer_id_fkey";
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_candidate_id_fkey";
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS conversation_employer_id_fkey;
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS conversation_candidate_id_fkey;

-- משרות (Job)
ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS "Job_employer_id_fkey";
ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS job_employer_id_fkey;

-- הגשות מועמדות (JobApplication)
ALTER TABLE "JobApplication" DROP CONSTRAINT IF EXISTS "JobApplication_applicant_id_fkey";
ALTER TABLE "JobApplication" DROP CONSTRAINT IF EXISTS jobapplication_applicant_id_fkey;

-- הודעות (Message)
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_sender_id_fkey";
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_receiver_id_fkey";
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_recipient_id_fkey";
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS message_sender_id_fkey;
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS message_receiver_id_fkey;
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS message_recipient_id_fkey;

-- פרופיל משתמש (UserProfile)
ALTER TABLE "UserProfile" DROP CONSTRAINT IF EXISTS "UserProfile_id_fkey";
ALTER TABLE "UserProfile" DROP CONSTRAINT IF EXISTS userprofile_id_fkey;

-- סטטיסטיקות (UserStats)
ALTER TABLE "UserStats" DROP CONSTRAINT IF EXISTS "UserStats_user_id_fkey";
ALTER TABLE "UserStats" DROP CONSTRAINT IF EXISTS userstats_user_id_fkey;

-- פעולות (UserAction)
ALTER TABLE "UserAction" DROP CONSTRAINT IF EXISTS "UserAction_user_id_fkey";
ALTER TABLE "UserAction" DROP CONSTRAINT IF EXISTS useraction_user_id_fkey;

-- התראות (Notification)
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_user_id_fkey";
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS notification_user_id_fkey;

-- קורות חיים (CV)
ALTER TABLE "CV" DROP CONSTRAINT IF EXISTS "CV_user_id_fkey";
ALTER TABLE "CV" DROP CONSTRAINT IF EXISTS cv_user_id_fkey;

-- שאלונים (QuestionnaireResponse)
ALTER TABLE "QuestionnaireResponse" DROP CONSTRAINT IF EXISTS "QuestionnaireResponse_user_id_fkey";
ALTER TABLE "QuestionnaireResponse" DROP CONSTRAINT IF EXISTS questionnaireresponse_user_id_fkey;

-- צפיות (JobView & CandidateView)
ALTER TABLE "JobView" DROP CONSTRAINT IF EXISTS "JobView_viewer_id_fkey";
ALTER TABLE "JobView" DROP CONSTRAINT IF EXISTS jobview_viewer_id_fkey;
ALTER TABLE "CandidateView" DROP CONSTRAINT IF EXISTS "CandidateView_candidate_id_fkey";
ALTER TABLE "CandidateView" DROP CONSTRAINT IF EXISTS "CandidateView_viewer_id_fkey";
ALTER TABLE "CandidateView" DROP CONSTRAINT IF EXISTS candidateview_candidate_id_fkey;
ALTER TABLE "CandidateView" DROP CONSTRAINT IF EXISTS candidateview_viewer_id_fkey;

COMMIT;
