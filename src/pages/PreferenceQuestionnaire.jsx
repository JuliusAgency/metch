
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/api/entities';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useRequireUserType } from '@/hooks/use-require-user-type';

const Question = ({ question, type = 'text', value, onChange }) => {
  const [localValue, setLocalValue] = useState(value || '');

  const handleChange = (e) => {
    setLocalValue(e.target.value);
    onChange(e.target.value);
  };

  const handleRadioChange = (val) => {
    setLocalValue(val);
    onChange(val);
  };

  return (
    <div className="space-y-3">
      <div className="text-right">
        <p className="inline-block bg-white border border-gray-300 rounded-full px-5 py-2">{question}</p>
      </div>
      <div>
        {type === 'text' ?
          <Input
            type="text"
            placeholder="תשובה"
            className="h-12 rounded-full text-right border-gray-300 px-5"
            value={localValue}
            onChange={handleChange} /> :
          <div className="flex items-center gap-4">
            <Input
              type="text"
              placeholder="תשובה"
              className="h-12 rounded-full text-right border-gray-300 px-5 flex-grow"
              value={localValue === 'כן' || localValue === 'לא' ? '' : localValue}
              onChange={handleChange}
              disabled={localValue === 'כן' || localValue === 'לא'} />

            <div className="flex gap-2">
              <Button
                type="button"
                variant={localValue === 'לא' ? 'default' : 'outline'}
                onClick={() => handleRadioChange('לא')}
                className={`rounded-full w-12 h-12 border-gray-300 ${localValue === 'לא' ? 'bg-blue-600 text-white' : ''}`}>
                לא
              </Button>
              <Button
                type="button"
                variant={localValue === 'כן' ? 'default' : 'outline'}
                onClick={() => handleRadioChange('כן')}
                className={`rounded-full w-12 h-12 border-gray-300 ${localValue === 'כן' ? 'bg-blue-600 text-white' : ''}`}>
                כן
              </Button>
            </div>
          </div>
        }
      </div>
    </div>
  );
};


export default function PreferenceQuestionnaire() {
  useRequireUserType(); // Ensure user has selected a user type
  const [answers, setAnswers] = useState({
    driving_license: '',
    relocation_interest: '',
    first_degree: ''
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        setAnswers({
          driving_license: userData.preference_driving_license || '',
          relocation_interest: userData.preference_relocation_interest || '',
          first_degree: userData.preference_first_degree || ''
        });
      } catch (error) {
        console.error("User not logged in", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAnswerChange = (questionKey, value) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await User.updateMyUserData({
        preference_driving_license: answers.driving_license,
        preference_relocation_interest: answers.relocation_interest,
        preference_first_degree: answers.first_degree
      });
      navigate(createPageUrl('Profile'));
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setSaving(false);
    }
  };

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
              }} />

                    </div>
                    <CardContent className="p-4 sm:p-6 md:p-8 -mt-12 relative z-10">
                        <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto space-y-12">

                            <h1 className="text-center text-3xl font-bold text-gray-900">שאלון סינון</h1>
                            
                            <div className="border border-gray-200 rounded-2xl p-8 space-y-8">
                                <Question
                  question="האם יש רישיון רכב?"
                  type="yes_no"
                  value={answers.driving_license}
                  onChange={(val) => handleAnswerChange('driving_license', val)} />

                                <Question
                  question="האם מיקום העבודה מתאים עבורך למשרה מלאה בחברה שלנו?"
                  value={answers.relocation_interest}
                  onChange={(val) => handleAnswerChange('relocation_interest', val)} />

                                <Question
                  question="האם יש תואר ראשון בכלכלה?"
                  type="yes_no"
                  value={answers.first_degree}
                  onChange={(val) => handleAnswerChange('first_degree', val)} />

                            </div>

                            <div className="text-center">
                                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-12 h-14 rounded-full font-bold text-lg bg-blue-600 hover:bg-blue-700">

                                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : "שלחו קורות חיים"}
                                </Button>
                            </div>
                        </motion.div>
                    </CardContent>
                </Card>
            </div>
        </div>);

}
