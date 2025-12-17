import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/supabaseClient';

const imgHugeiconsAiMagic = "https://www.svgrepo.com/show/530438/magic-wand.svg";

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            toast({
                title: "מייל שחזור נשלח",
                description: "בדקו את תיבת המייל שלכם (כולל ספאם) לקישור לאיפוס סיסמה.",
            });

            // Optionally navigate back to login after a delay
            setTimeout(() => navigate('/Login'), 3000);

        } catch (error) {
            toast({
                title: "שגיאה בשליחת המייל",
                description: error.message || "אירעה שגיאה. אנא נסו שנית.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-b from-[#dbecf3] from-[12.35%] to-[#ffffff] via-[#ffffff] via-[32.336%] min-h-screen flex items-center justify-center p-4">
            {/* Background Card */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-[rgba(255,255,255,0.5)] rounded-[40px] shadow-[0px_0px_17.611px_0px_rgba(0,0,0,0.2)] w-full max-w-4xl h-full max-h-[90vh]" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md mx-auto">

                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="backdrop-blur-[43px] backdrop-filter bg-[rgba(204,229,248,0.3)] border border-solid border-white rounded-full p-4">
                        <div className="flex items-center space-x-2">
                            <img alt="" className="w-8 h-8" src={imgHugeiconsAiMagic} />
                            <p className="font-['Poppins:Regular',_sans-serif] text-2xl text-black font-medium">
                                Metch
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-8">

                    {/* Title */}
                    <div className="text-center">
                        <h1 className="font-['Rubik:Bold',_sans-serif] font-bold text-3xl md:text-4xl text-[#32343d] mb-2" dir="auto">
                            שחזור סיסמה
                        </h1>
                        <p className="text-[#6a6a6a] text-lg" dir="auto">
                            הזינו את המייל איתו נרשמתם ונשלח לכם קישור לאיפוס סיסמה
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Email Field */}
                        <div className="relative">
                            <div className="absolute bottom-0 left-0 right-0 h-px bg-[#6a6a6a]"></div>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-transparent border-none outline-none text-right text-lg text-[#32343d] placeholder-[#6a6a6a] py-2"
                                placeholder="כתובת מייל"
                                dir="rtl"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#2987cd] hover:bg-[#2987cd]/90 text-white rounded-full h-12 text-lg font-bold"
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="font-['Rubik:Bold',_sans-serif] font-bold text-lg" dir="auto">
                                        שלח קישור לאיפוס
                                    </span>
                                </div>
                            </Button>
                        </div>
                    </form>

                    {/* Back to Login */}
                    <div className="text-center">
                        <Link to="/Login" className="font-['Rubik:Bold',_sans-serif] font-bold text-[#2987cd] hover:underline">
                            חזרה להתחברות
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
