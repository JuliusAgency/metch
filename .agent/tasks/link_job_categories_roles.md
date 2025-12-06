# Task: Link Job Categories to Roles

## Status: Completed

## Changes Implemented
1.  **Created `src/job_taxonomy.json`**:
    - Created a mapping file between job categories and specific job roles.
    - Currently populated with the "Information Security" (אבטחת מידע) category and its associated roles as requested.

2.  **Modified `src/components/job_creation/Step1Details.jsx`**:
    - Imported `jobTaxonomy`.
    - Implemented logic to filter the `titleOptions` (Roles) based on the selected `category`.
    - If a category exists in the taxonomy, only its mapped roles are shown.
    - If a category is not in the taxonomy, the full list of job titles (`jobs.json`) is shown (backward compatibility).

## Verification
- When "אבטחת מידע" is selected, the roles dropdown shows only the relevant cybersecurity roles.
- Changing to another category reverts to the full list.
