import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, MessageSquare, CheckCircle, HelpCircle, Info, Save } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

const HelpTooltip = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        style={{ direction: "rtl" }}
        onClick={onClose}>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
          dir="rtl">

          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">

              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">שאלון סינון</h3>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed text-right">
            שאלון זה נועד לקבל מידע נוסף מהמועמד בעת הגשת קורות חיים.
            השאלון יכול לעזור לכם לקבל פרטים שלא מופיעים בדרישות משרה או בקורות חיים - זכרו,
            השאלון הוא לא מבחן אלא כלי לקבלת מידע נוסף.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>);

};

const DynamicQuestionInput = ({ type, placeholder, questions, onAdd, onRemove }) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddItem = () => {
    if (inputValue.trim() !== "") {
      onAdd({ text: inputValue.trim(), type: type });
      setInputValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          {type === 'text' ?
            <MessageSquare className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /> :

            <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          }
          <Input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-12 rounded-full border-gray-300 text-right pr-12"
            dir="rtl" />

        </div>
        <Button type="button" onClick={handleAddItem} className="bg-slate-50 text-blue-600 px-4 py-2 text-sm font-semibold inline-flex items-center justify-center gap-2 rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:text-blue-800 whitespace-nowrap">
          + הוסף שאלה
        </Button>
      </div>
      {questions.filter((q) => q.type === type).length > 0 &&
        <div className="flex flex-wrap gap-2 pt-2">
          <AnimatePresence>
            {questions.filter((q) => q.type === type).map((item, index) =>
              <motion.div
                key={`${type}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 bg-gray-100 text-gray-800 rounded-lg px-3 py-1.5">

                <span>{item.text}</span>
                <button type="button" onClick={() => onRemove(item)} className="text-gray-500 hover:text-gray-800">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
    </div>);

};

export default function Step2Screening({ jobData, setJobData, onSave }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleAddQuestion = (question) => {
    setJobData((prev) => ({
      ...prev,
      screening_questions: [...(prev.screening_questions || []), question]
    }));
  };

  const handleRemoveQuestion = (questionToRemove) => {
    setJobData((prev) => ({
      ...prev,
      screening_questions: (prev.screening_questions || []).filter((q) => q.text !== questionToRemove.text || q.type !== questionToRemove.type)
    }));
  };

  return (
    <div className="max-w-3xl mx-auto" dir="rtl">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-gray-900">שאלון סינון</h1>
        <Button
          variant="link"
          className="text-blue-600"
          onClick={() => setShowTooltip(true)}>

          <HelpCircle className="w-4 h-4 ml-1" />
          מה זה?
        </Button>
      </div>

      <div className="space-y-8 bg-white p-8 rounded-2xl border border-gray-200">
        <DynamicQuestionInput
          type="text"
          placeholder="שאלה"
          questions={jobData.screening_questions || []}
          onAdd={handleAddQuestion}
          onRemove={handleRemoveQuestion} />

        <div className="border-t border-gray-200"></div>
        <DynamicQuestionInput
          type="yes_no"
          placeholder="שאלת כן/לא"
          questions={jobData.screening_questions || []}
          onAdd={handleAddQuestion}
          onRemove={handleRemoveQuestion} />

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => onSave && onSave()}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
            disabled={(!jobData.screening_questions || jobData.screening_questions.length === 0)}
          >
            <Save className="w-4 h-4" />
            שמור שאלון
          </Button>
        </div>
      </div>

      <HelpTooltip
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)} />

    </div>);

}