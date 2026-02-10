import { supabase } from './supabaseClient';

// כתובת השרת - יש לוודא שמוגדר בקובץ .env
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

/**
 * Metch Backend API Integration
 */
export const MetchApi = {
    /**
     * יצירת טרנזקציה חדשה ב-CardCom דרך השרת
     * @param {Object} transactionData - פרטי העסקה
     * @param {number} transactionData.Amount - סכום לחיוב
     * @param {string} transactionData.CardNumber - מספר כרטיס
     * @param {string} transactionData.CardExpirationMMYY - תוקף (MMYY)
     * @param {string} transactionData.CVV2 - קוד אבטחה
     * @param {string} [transactionData.CardOwnerName] - שם בעל הכרטיס
     * @param {string} [transactionData.CardOwnerEmail] - אימייל בעל הכרטיס
     * @param {string} [transactionData.CardOwnerPhone] - טלפון בעל הכרטיס
     * @param {string} [transactionData.CardOwnerIdentityNumber] - ת.ז. בעל הכרטיס
     * @param {number} [transactionData.NumberOfPayments] - מספר תשלומים
     * @returns {Promise<Object>} תשובת השרת כולל אישור וטוקן
     */
    async createTransaction(transactionData) {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            throw new Error('User not authenticated - Cannot get access token');
        }

        const token = session.access_token;

        try {
            // Call Supabase Edge Function 'create-payment'
            const { data, error } = await supabase.functions.invoke('create-payment', {
                body: transactionData
            });

            if (error) {
                console.error("Supabase Function Error:", error);
                throw new Error("Payment service unavailable");
            }

            if (!data.success) {
                console.error("Payment Failed Details:", data); // Log full details for debugging
                const detailedError = `${data.message} (Code: ${data.data?.responseCode || 'N/A'})`;
                throw new Error(detailedError);
            }

            return data;
        } catch (err) {
            console.error("API Error Details:", err);
            throw err;
        }
    },


    async healthCheck() {
        const response = await fetch(`${BASE_URL}/health`);
        return await response.json();
    }
};
