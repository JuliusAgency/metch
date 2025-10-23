
import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, FileText, UploadCloud, Replace, Edit, Trash2, ChevronLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CV } from '@/api/entities';
import { User } from '@/api/entities';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function Profile() {
  const [cvData, setCvData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLookingForJob, setIsLookingForJob] = useState(true);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);
        setIsLookingForJob(userData.available_for_work !== false); 

        const cvs = await CV.filter({ user_email: userData.email });
        if (cvs.length > 0) {
          setCvData({
              ...cvs[0],
              file_name: cvs[0].file_name || 'אלון כהן...מעבדה ux ui סביון קורץ 2025.pdf',
              last_modified: cvs[0].last_modified || '2025-05-30T11:30:00Z',
              file_size_kb: cvs[0].file_size_kb || 867,
          });
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleLookingForJob = async (checked) => {
    if (!user) return;
    setIsLookingForJob(checked);
    try {
      await User.updateMyUserData({ available_for_work: checked });
    } catch (error) {
      console.error("Error updating user status:", error);
      setIsLookingForJob(!checked);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("File selected:", file.name);
      // In a real scenario, you'd upload the file and then save its metadata.
      // For now, we simulate this by updating the state.
       setCvData({
          ...cvData,
          file_name: file.name,
          last_modified: new Date().toISOString(),
          file_size_kb: Math.round(file.size / 1024),
      });
    }
  };
  
  const handleDeleteFile = () => {
      // Here you would handle the delete logic (e.g., call CV.delete)
      console.log("Deleting file");
      setCvData(null);
  };

  const NoCvView = () => (
    <div 
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors"
        onClick={() => navigate(createPageUrl('CVGenerator'))}
    >
      <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">העלה קורות חיים</h3>
      <p className="mt-1 text-sm text-gray-500">גרור קובץ או לחץ כאן כדי לבחור (PDF, DOCX)</p>
    </div>
  );

  const FileManagementCard = () => (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-right">
                <FileText className="w-10 h-10 text-red-500 flex-shrink-0" />
                <div>
                    <p className="font-medium text-gray-800 truncate" title={cvData.file_name}>{cvData.file_name}</p>
                    <p className="text-sm text-gray-500">
                        {format(new Date(cvData.last_modified), 'dd.MM.yyyy HH:mm')} &bull; {cvData.file_size_kb} Kb
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
                <button onClick={handleDeleteFile} className="flex items-center gap-1 text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" /> מחק קובץ
                </button>
                <Link to={createPageUrl('CVGenerator')} className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
                    <Edit className="w-4 h-4" /> ערוך קובץ
                </Link>
                 <button onClick={() => navigate(createPageUrl('CVGenerator'))} className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
                    <Replace className="w-4 h-4" /> החלף קובץ
                </button>
            </div>
        </div>
    </div>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
        <div className="w-[85vw] mx-auto">
            <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="relative h-24 overflow-hidden -m-px">
                    <div 
                        className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
                        style={{
                            backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ca93821b0_image.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center top'
                        }}
                    />
                </div>
                <CardContent className="p-4 sm:p-6 md:p-8 -mt-12 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-4xl mx-auto space-y-12"
                    >
                        <h1 className="text-center text-3xl font-bold text-gray-900">ניהול הפרטים שלי</h1>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                        />

                        {cvData ? <FileManagementCard /> : <NoCvView />}

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                             <Button asChild variant="outline" className="w-full sm:w-auto h-12 rounded-lg border-gray-300 text-gray-800 font-semibold text-base justify-between px-5">
                                <Link to={createPageUrl('PreferenceQuestionnaire')}>
                                    ניהול שאלון העדפה
                                    <ChevronLeft className="w-5 h-5" />
                                </Link>
                            </Button>
                            <div className="flex items-center gap-3">
                                <Switch 
                                    checked={isLookingForJob}
                                    onCheckedChange={handleToggleLookingForJob}
                                    id="looking-for-job" 
                                />
                                <label htmlFor="looking-for-job" className="font-semibold text-gray-800 text-base">אני מחפש עבודה</label>
                            </div>
                        </div>

                    </motion.div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
