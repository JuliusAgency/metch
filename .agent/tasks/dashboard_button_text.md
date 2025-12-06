# Task: Update Dashboard Button Text for Job Views

## Status: Completed

## Changes Implemented
1.  **Modified `src/pages/Dashboard.jsx`**:
    - Updated the "View Job" button text logic in `JobSeekerDashboard`.
    - Used `viewedJobIds.has(job.id)` to conditionally render the text:
        - If viewed: **"נצפה"** (Viewed).
        - If new: **"צפייה"** (View).

## Verification
- Code review confirms the conditional rendering is in place.
