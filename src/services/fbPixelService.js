import { supabase } from '../api/supabaseClient';

/**
 * Facebook Pixel / Conversions API Service
 * Handles sending events to the server-side Edge Function 'fb-conversion-api'
 */

const PIXEL_ID = "4084317741711176";

/**
 * Initialize Facebook Pixel
 */
export const initFacebookPixel = () => {
  if (window.fbq) return;

  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
};

/**
 * Generic function to send an event to Facebook CAPI and Browser Pixel
 * @param {string} eventName - Standard FB event name (e.g. 'CompleteRegistration', 'Purchase')
 * @param {Object} userData - User PII (email, phone, firstName) to be hashed on server (and used for browser matching)
 * @param {Object} customData - Event specific data (value, currency, etc.)
 * @param {string} eventId - Unique ID for deduplication (optional, will be generated if missing)
 */
export const trackFbEvent = async (eventName, userData, customData = {}, eventId = null) => {
  try {
    const uniqueId = eventId || `${eventName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 1. Browser Pixel Tracking (if initialized)
    if (window.fbq) {
      window.fbq('track', eventName, customData, { eventID: uniqueId });
    }

    // 2. CAPI Tracking (Server-Side)
    if (!userData || (!userData.email && !userData.phone)) {
        console.warn("[FbPixelService] Missing user data for CAPI, event might not match well.");
    }

    const currentUrl = window.location.href;
    const userAgent = navigator.userAgent;

    const payload = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: currentUrl,
      event_id: uniqueId,
      user_data: {
        em: userData.email,
        ph: userData.phone,
        fn: userData.firstName,
        client_user_agent: userAgent
      },
      custom_data: customData
    };

    console.log(`[FbPixelService] Sending ${eventName} to Edge Function (CAPI)...`, payload);

    const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
      body: payload
    });

    if (error) {
      console.error(`[FbPixelService] Failed to send ${eventName} to CAPI:`, error);
    } else {
      console.log(`[FbPixelService] ${eventName} sent successfully to CAPI:`, data);
    }

  } catch (err) {
    console.error(`[FbPixelService] Unexpected error sending ${eventName}:`, err);
  }
};

/**
 * Track Complete Registration Event
 * @param {Object} user - User object from DB/State
 * @param {string} userType - 'jobseeker' or 'employer'
 */
export const trackCompleteRegistration = (user, userType) => {
    trackFbEvent('CompleteRegistration', {
        email: user.email,
        phone: user.phone || user.phone_number, // Handle different field names
        firstName: user.first_name || user.name
    }, {
        user_type: userType
    }, `reg_${user.id}_${Date.now()}`);
};

/**
 * Track Start Trial Event (Employer Only)
 * @param {Object} user - Employer user object
 */
export const trackStartTrial = (user) => {
    trackFbEvent('StartTrial', {
        email: user.email,
        phone: user.phone || user.phone_number,
        firstName: user.first_name || user.name || user.company_name
    }, {
        user_type: 'employer',
        trial_type: 'free_job_post_1'
    }, `trial_${user.id}_${Date.now()}`);
};

/**
 * Track Purchase Event
 * @param {Object} user - User object
 * @param {number} value - Total transaction value
 * @param {string} currency - e.g. 'ILS'
 * @param {string} orderId - Unique order ID
 * @param {number} numItems - Number of items purchased
 */
export const trackPurchase = (user, value, currency = 'ILS', orderId, numItems = 1) => {
    trackFbEvent('Purchase', {
        email: user.email,
        phone: user.phone || user.phone_number,
        firstName: user.first_name || user.name
    }, {
        user_type: 'employer',
        value: Number(value),
        currency: currency,
        num_items: numItems
    }, orderId ? `order_${orderId}` : `purchase_${Date.now()}`);
};
