import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Trash2, ArrowLeft, Info, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

const HelpTooltip = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[24px] p-6 max-w-lg w-full mx-4 shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full border border-gray-900 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <X className="w-5 h-5 text-gray-900 stroke-[2.5px]" />
          </button>

          <div className="flex items-start gap-6">
            <div className="shrink-0">
              <div className="w-14 h-14 rounded-full border-[3px] border-[#001a6e] flex items-center justify-center">
                <span className="text-[#001a6e] text-3xl font-serif font-bold italic">i</span>
              </div>
            </div>

            <div className="flex-1 text-right pt-1">
              <h3 className="text-2xl font-bold text-[#001a6e] mb-3">שאלון סינון</h3>
              <p className="text-gray-700 text-base leading-relaxed font-medium">
                שאלון זה נועד לקבל מידע נוסף מהמועמד בעת הגשת קורות חיים,
                השאלון יכול לעזור לכם לקבל פרטים שלא מופיעים בדרישות משרה או בקורות חיים - זכרו, השאלון הוא לא מבחן אלא כלי לקבלת מידע נוסף.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const QuestionItem = ({ question, onRemove }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-xl shadow-sm group"
  >
    <div className="flex items-center gap-3">
      {question.type === 'yes_no' ? (
        <div className="flex gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full border border-blue-600 text-blue-600 flex items-center justify-center text-xs font-medium">כן</div>
          <div className="w-8 h-8 rounded-full border border-blue-600 text-blue-600 flex items-center justify-center text-xs font-medium">לא</div>
        </div>
      ) : (
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-gray-500 text-xs">מילולי</span>
        </div>
      )}
      <span className="font-medium text-gray-700">{question.text}</span>
    </div>
    <button
      onClick={() => onRemove(question)}
      className="text-gray-400 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </motion.div>
);

export default function Step2Screening({ jobData, setJobData, onSave, onNext }) {
  const [textInput, setTextInput] = useState("");
  const [yesNoInput, setYesNoInput] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  const handleAddQuestion = (text, type) => {
    if (!text.trim()) return;
    const question = { text: text.trim(), type };
    setJobData((prev) => ({
      ...prev,
      screening_questions: [...(Array.isArray(prev.screening_questions) ? prev.screening_questions : []), question]
    }));
    if (type === 'text') setTextInput("");
    if (type === 'yes_no') setYesNoInput("");
    if (onSave) onSave(); // Mark as saved in parent
  };

  const handleRemoveQuestion = (questionToRemove) => {
    setJobData((prev) => ({
      ...prev,
      screening_questions: (Array.isArray(prev.screening_questions) ? prev.screening_questions : []).filter((q) => q.text !== questionToRemove.text || q.type !== questionToRemove.type)
    }));
    if (onSave) onSave();
  };

  const questions = Array.isArray(jobData.screening_questions) ? jobData.screening_questions : [];

  return (
    <div className="max-w-4xl mx-auto pb-20" dir="rtl">
      {/* Header with Help Trigger */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">שאלון סינון</h1>
        <button
          onClick={() => setShowTooltip(true)}
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          <span>מה זה?</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">

        {/* Added Questions List */}
        {questions.length > 0 && (
          <div className="mb-8 space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">שאלות שנוספו:</h3>
            <AnimatePresence>
              {questions.map((q, idx) => (
                <QuestionItem key={idx} question={q} onRemove={handleRemoveQuestion} />
              ))}
            </AnimatePresence>
            <div className="border-b border-gray-100 my-6"></div>
          </div>
        )}

        <div className="space-y-10">
          {/* Text Question Section */}
          <div className="space-y-3">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion(textInput, 'text')}
              placeholder="שאלה"
              className="h-14 rounded-full border-gray-300 text-right px-6 text-lg focus-visible:ring-blue-500"
            />
            <div className="flex justify-start">
              <button
                onClick={() => handleAddQuestion(textInput, 'text')}
                className="text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center gap-1 pr-2"
              >
                <Plus className="w-4 h-4" />
                הוסף שאלה
              </button>
            </div>
          </div>

          {/* Yes/No Question Section */}
          <div className="space-y-3">
            <div className="flex gap-4 items-center">
              <div className="flex gap-2 shrink-0">
                <div className="w-10 h-10 rounded-full border border-[#001a6e] text-[#001a6e] flex items-center justify-center font-medium">כן</div>
                <div className="w-10 h-10 rounded-full border border-[#001a6e] text-[#001a6e] flex items-center justify-center font-medium">לא</div>
              </div>
              <Input
                value={yesNoInput}
                onChange={(e) => setYesNoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion(yesNoInput, 'yes_no')}
                placeholder="שאלת כן\לא"
                className="h-14 rounded-full border-gray-300 text-right px-6 text-lg focus-visible:ring-blue-500 w-full"
              />
            </div>
            <div className="flex justify-start">
              <button
                onClick={() => handleAddQuestion(yesNoInput, 'yes_no')}
                className="text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center gap-1 pr-2"
              >
                <Plus className="w-4 h-4" />
                הוסף שאלה
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Button - The only one at the bottom as per user request */}
      <div className="flex justify-center mt-12">
        <Button
          onClick={onNext}
          className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-16 py-7 rounded-full text-xl font-bold shadow-lg transition-all active:scale-95"
        >
          שמירה וסיום
          <ArrowLeft className="w-6 h-6 mr-2" />
        </Button>
      </div>

      <HelpTooltip isOpen={showTooltip} onClose={() => setShowTooltip(false)} />
    </div>
  );
}
