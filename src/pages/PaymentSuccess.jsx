
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { supabase } from '@/api/supabaseClient';

const PaymentSuccess = () => {
    console.log('--- PaymentSuccess COMPONENT LOADING ---');

    // Iframe Communication: Instead of direct breakout, we send a message to the parent
    useEffect(() => {
        if (window.top !== window.self) {
            console.log('Sending success message to parent window...');
            window.parent.postMessage({
                type: 'CARDCOM_PAYMENT_SUCCESS',
                url: window.location.pathname + window.location.search
            }, window.location.origin);
        }
    }, []);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [verifying, setVerifying] = useState(true);
    const [message, setMessage] = useState('מאמת תשלום...');

    useEffect(() => {
        const verifyAndRedirect = async () => {
            const entries = Object.fromEntries(searchParams.entries());
            const requestId = searchParams.get('ref');
            const lowProfileCode = searchParams.get('lowprofilecode') || searchParams.get('LowProfileCode');

            console.log('--- PaymentSuccess MOUNTED ---');
            console.log('Full Query Params:', JSON.stringify(entries, null, 2));
            console.log('Detected requestId:', requestId);
            console.log('Detected lowProfileCode:', lowProfileCode);
            console.log('Window top state:', window.self === window.top ? 'Main window' : 'Inside iframe');

            if (requestId) {
                try {
                    console.log('Verifying payment for request:', requestId);
                    setMessage('מעדכן יתרת משרות...');

                    // Set a timeout for the verification
                    const verifyPromise = supabase.functions.invoke('verify-payment', {
                        body: { requestId, lowProfileCode }
                    });

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('timeout')), 15000)
                    );

                    const { data, error } = await Promise.race([verifyPromise, timeoutPromise]);

                    if (error) {
                        console.error('Verify payment error (invoke):', error);
                        setMessage(`שגיאת אימות: ${error.message || 'לא התקבלה תגובה מהשרת'}`);
                        setVerifying(false);
                        return;
                    } else {
                        console.log('Verification response data:', data);
                        if (data && data.success) {
                            setMessage('התשלום אומת והמשרות עודכנו!');
                        } else {
                            setMessage(`התראה: ${data?.message || 'לא הצלחנו לאמת את העסקה'}`);
                            setVerifying(false);
                            return;
                        }
                    }
                } catch (err) {
                    console.error('Verification failed:', err);
                    if (err.message === 'timeout') {
                        setMessage('האימות לוקח זמן רב מהרגיל. אנא בדוק את יתרת המשרות שלך בעוד מספר רגעים.');
                    } else {
                        setMessage(`שגיאת מערכת: ${err.message}`);
                    }
                    setVerifying(false);
                    return;
                }
            } else {
                console.warn('PaymentSuccess: Missing requestId (ref)!');
                setMessage('תודה על התשלום! (שים לב: חסר מזהה עסקה, ייתכן שהעדכון ייקח זמן)');
            }

            setVerifying(false);

            // Redirect after delay
            const targetUrl = createPageUrl("Payments?success=true");
            console.log('Final success navigation to:', window.location.origin + targetUrl);

            setTimeout(() => {
                if (window.self !== window.top) {
                    window.top.location.href = window.location.origin + targetUrl;
                } else {
                    navigate(targetUrl);
                }
            }, 5000);
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
