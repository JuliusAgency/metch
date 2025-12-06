# Task: Add Form Validation to Create Job Page

## Status: Completed

## Changes Implemented
1.  **Modified `src/pages/CreateJob.jsx`**:
    - Added `isStepValid` function to validate mandatory fields for Step 1.
    - Fields validated:
        - `title` (תפקיד)
        - `category` (תחום משרה)
        - `start_date` (תחילת העבודה)
        - `employment_type` (סוג המשרה)
    - Updated the "Next" (המשך) button to be `disabled` when validation fails.
    - The button now appears "grayed out" (opacity 50%) when disabled, preventing progression to the next step.

## Verification
- User confirmed the functionality works as expected ("זה עובד אין בעיה").
