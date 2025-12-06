# Task: Style Viewed Button as Gray

## Status: Completed

## Changes Implemented
1.  **Modified `src/pages/Dashboard.jsx`**:
    - Updated the `className` logic for the job view button in `JobSeekerDashboard`.
    - If the job has been viewed (`viewedJobIds.has(job.id)`):
        - Applies `bg-gray-400 hover:bg-gray-500` (Gray).
    - If the job is new:
        - Maintains `bg-[#84CC9E] hover:bg-green-500` (Green).

## Verification
- Code review confirms conditional class logic is correct.
