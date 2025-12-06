# Task: Add Save Button to Screening Questionnaire

## Status: Completed

## Changes Implemented
1.  **Modified `src/components/job_creation/Step2Screening.jsx`**:
    - Added a "Save" button below the screening questions.
    - Imported `Save` icon from `lucide-react`.
    - Accepts an `onSave` prop that is called when the button is clicked.
    - The button is disabled if there are no screening questions.

2.  **Modified `src/pages/CreateJob.jsx`**:
    - Added `isScreeningSaved` state to track if the user has explicitly saved the screening questions.
    - Passed `onSave={() => setIsScreeningSaved(true)}` to `Step2Screening`.
    - Updated `getNextButtonText` logic:
        - If Step 3 (Screening) and no questions: "דלג" (Skip).
        - If Step 3 and questions exist: "המשך" (Next).
    - Updated `isNextDisabled` logic:
        - If Step 3, questions exist, and `!isScreeningSaved`: Button is disabled.
    - Updated button styling:
        - If Step 3 and saved: Button turns green (`bg-green-600`).
    - Added `useEffect` to reset `isScreeningSaved` to `false` whenever `jobData.screening_questions` changes (e.g., adding/removing questions).

## Verification
- User flow logic:
    - Empty questionnaire -> "Skip" button enabled.
    - Add question -> "Next" button disabled (must save).
    - Click Save -> "Next" button enabled and turns green.
    - Modify question -> "Next" button disabled again (must save).
