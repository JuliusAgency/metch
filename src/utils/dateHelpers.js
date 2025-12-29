/**
 * Date utility functions for inactivity tracking
 */

/**
 * Calculate the number of days since a given date
 * @param {string} dateString - ISO date string
 * @returns {number} Number of days since the date
 */
export const getDaysSince = (dateString) => {
    if (!dateString) return 0;

    const date = new Date(dateString);
    const now = new Date();

    // Check if date is valid
    if (isNaN(date.getTime())) return 0;

    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
};

/**
 * Check if a user is inactive based on last login
 * @param {string} lastLoginDate - ISO date string of last login
 * @param {number} thresholdDays - Number of days to consider inactive (default: 14)
 * @returns {boolean} True if user is inactive
 */
export const isUserInactive = (lastLoginDate, thresholdDays = 14) => {
    if (!lastLoginDate) return false; // No login date means active

    const daysSinceLogin = getDaysSince(lastLoginDate);
    return daysSinceLogin >= thresholdDays;
};
