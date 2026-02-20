import { supabase } from '@/api/supabaseClient';

export const generateLowProfileUrl = async (paymentDetails, customerDetails, metadata = {}, userId = null) => {
  try {
    console.log('Invoking create-payment Edge Function for user:', userId);
    
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: {
        amount: paymentDetails.amount,
        productName: paymentDetails.productName,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        origin: window.location.origin,
        userId, // Pass explicitly for iframe safety
        metadata
      }
    });

    if (error) {
      console.error('Edge Function invocation error:', error);
      throw error;
    }

    if (!data || !data.success) {
      console.error('Payment creation failed:', data?.message);
      throw new Error(data?.message || 'Failed to create payment session');
    }

    console.log('Received Payment URL from server:', data.url);
    console.log('Received Payment URL from server:', data.url);
    return { url: data.url, requestId: data.requestId };

  } catch (error) {
    console.error('Error in cardcomService:', error);
    throw error;
  }
};
