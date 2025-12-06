# Task: Fix Settings Page Back Button

## Status: Completed

## Changes Implemented
1.  **Modified `src/pages/Settings.jsx`**:
    - Increased the `z-index` of the "Back" button (Link) from `z-10` to `z-20`.
    - This resolves the issue where the `CardContent` (which has a negative top margin `-mt-16` and `z-10`) was overlapping the bottom portion of the button, making it unclickable in those areas.

## Verification
- Code analysis confirms the stacking context issue is resolved by promoting the button to a higher layer.
