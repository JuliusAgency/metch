
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { supabase } from '@/api/supabaseClient';

const PaymentSuccess = () => {
    console.log('--- PaymentSuccess COMPONENT LOADING ---');
    // Basic alert to confirm we even reached this page (debug only)
    // window.alert('Payment Page Reached'); 

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [verifying, setVerifying] = useState(true);
    const [message, setMessage] = useState('מאמת תשלום...');

    useEffect(() => {
        const verifyAndRedirect = async () => {
            const requestId = searchParams.get('ref');
            const lowProfileCode = searchParams.get('lowprofilecode') || searchParams.get('LowProfileCode');
            console.log('PaymentSuccess mounted. Search Params:', Object.fromEntries(searchParams.entries()));
            console.log('Window top state:', window.self === window.top ? 'Main window' : 'Inside iframe');

            if (requestId) {
                try {
                    console.log('Verifying payment for request:', requestId);
                    setMessage('מעדכן יתרת משרות...');

                    const { data, error } = await supabase.functions.invoke('verify-payment', {
                        body: { requestId, lowProfileCode }
                    });

                    if (error) {
                        console.error('Verify payment error (invoke):', error);
                        const errMsg = `שגיאת אימות: ${error.message || JSON.stringify(error)}`;
                        setMessage(errMsg);
                        window.alert(errMsg); // Debug alert
                        setVerifying(false); // Stop loading
                        return; // DON'T redirect on error
                    } else {
                        console.log('Verification response data:', data);
                        if (data && data.success) {
                            setMessage('התשלום אומת והמשרות עודכנו!');
                        } else {
                            console.warn('Verification returned success=false:', data?.message);
                            const warnMsg = `התראה: ${data?.message || 'אימות חלקי'}`;
                            setMessage(warnMsg);
                            window.alert(warnMsg); // Debug alert
                            setVerifying(false);
                            return; // DON'T redirect on warning
                        }
                    }
                } catch (err) {
                    console.error('Verification failed:', err);
                    window.alert(`שגיאת קוד: ${err.message}`);
                    setVerifying(false);
                    return;
                }
            } else {
                setMessage('התשלום עבר בהצלחה!');
            }

            setVerifying(false);

            // Redirect after delay
            const targetUrl = createPageUrl("Payments?success=true");
            console.log('Redirecting to:', targetUrl);

            setTimeout(() => {
                if (window.self !== window.top) {
                    console.log('Executing top-level redirect...');
                    window.top.location.href = window.location.origin + targetUrl;
                } else {
                    console.log('Executing navigation...');
                    navigate(targetUrl);
                }
            }, 3000);
        };

        verifyAndRedirect();
    }, [navigate, searchParams]);

    const handleManualRedirect = () => {
        if (window.self !== window.top) {
            window.top.location.href = window.location.origin + createPageUrl("JobManagement");
        } else {
            navigate(createPageUrl("JobManagement"));
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4" dir="rtl">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    {verifying ? (
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900">{verifying ? 'מעבד תשלום...' : 'התשלום עבר בהצלחה!'}</h1>
                <p className="text-gray-600">
                    {message}
                    <br />
                    {!verifying && 'מיד תועבר לעמוד ניהול המשרות...'}
                </p>

                <div className="pt-4">
                    <Button
                        onClick={handleManualRedirect}
                        disabled={verifying}
                        className="w-full bg-[#1E3A8A] hover:bg-[#152a65] text-white rounded-full py-6"
                    >
                        מעבר למשרות שלי
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
