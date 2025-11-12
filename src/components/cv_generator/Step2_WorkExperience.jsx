import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PillInput = ({ name, placeholder, value, onChange, type = "text", onFocus, onBlur, ...rest }) =>
<Input
  name={name}
  placeholder={placeholder}
  value={value || ''}
  onChange={onChange}
  type={type}
  onFocus={onFocus}
  onBlur={onBlur}
  {...rest}
  className="w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400" />;



const newExperienceItem = () => ({
  id: `exp_${Date.now()}_${Math.random()}`,
  title: '',
  company: '',
  location: '',
  start_date: '',
  end_date: '',
  is_current: false,
  description: ''
});

export default function Step2_WorkExperience({ data, setData }) {
  const [currentItem, setCurrentItem] = useState(newExperienceItem());
  const minDate = '1900-01-01';
  const today = new Date().toISOString().split('T')[0];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentItem((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    if (!currentItem.title && !currentItem.company) return; // Don't save empty items

    const existingItemIndex = data.findIndex((item) => item.id === currentItem.id);

    if (existingItemIndex > -1) {
      setData((prevData) => {
        const newData = [...(prevData || [])];
        newData[existingItemIndex] = currentItem;
        return newData;
      });
    } else {
      setData((prevData) => [...(prevData || []), currentItem]);
    }
    setCurrentItem(newExperienceItem());
  };

  const handleSelectItem = (itemToSelect) => {
    // Before switching, save any pending changes in the form
    handleSave();
    setCurrentItem(itemToSelect);
  };

  const handleRemoveItem = (idToRemove, e) => {
    e.stopPropagation();
    setData((prevData) => (prevData || []).filter((item) => item.id !== idToRemove));
    if (currentItem.id === idToRemove) {
      setCurrentItem(newExperienceItem());
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-center" dir="rtl">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">ניסיון תעסוקתי וצבאי</h2>
            <p className="text-gray-600 mb-12 max-w-lg mx-auto">בחלק הזה תפרטו על הניסיון התעסוקתי שלכם</p>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PillInput name="title" placeholder="תפקיד" value={currentItem.title} onChange={handleInputChange} />
                    <PillInput name="company" placeholder="שם חברה" value={currentItem.company} onChange={handleInputChange} />
                    <PillInput name="location" placeholder="מיקום" value={currentItem.location} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PillInput type="text" name="start_date" placeholder="תאריך התחלה" value={currentItem.start_date} onChange={handleInputChange} onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} min={minDate} max={today} />
                    <PillInput type="text" name="end_date" placeholder="תאריך סיום" value={currentItem.end_date} onChange={handleInputChange} disabled={currentItem.is_current} onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} min={minDate} max={today} />
                </div>
                <div className="flex items-center gap-2 justify-center">
                    <input type="checkbox" id={`is_current_${currentItem.id}`} name="is_current" checked={currentItem.is_current} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor={`is_current_${currentItem.id}`} className="text-sm font-medium text-gray-700">אני עובד/ת כאן כיום</label>
                </div>
                <Textarea
          name="description"
          placeholder="תיאור התפקיד והישגים עיקריים"
          value={currentItem.description}
          onChange={handleInputChange}
          className="w-full bg-white border-gray-200 rounded-xl p-4 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400 min-h-[120px]" />
            </div>

            <div className="mt-6 flex justify-start">
                <Button variant="link" className="text-blue-600 font-semibold" onClick={handleSave}>
                    <Plus className="w-4 h-4 ml-2" />
                    {data.find((i) => i.id === currentItem.id) ? 'עדכן ניסיון' : 'הוסף ניסיון'}
                </Button>
            </div>

            {data && data.length > 0 &&
      <div className="mt-8 p-4 bg-white border border-gray-200/90 rounded-2xl flex flex-wrap justify-start gap-3">
                    <AnimatePresence>
                        {data.map((item) =>
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}>

                                <div
              onClick={() => handleSelectItem(item)} className="flex items-center gap-2 pl-2 pr-4 py-2 rounded-full cursor-pointer transition-colors bg-[#EDF8EF]">


                                    <span className="font-medium text-sm text-gray-700">{item.title || 'ניסיון חדש'}</span>
                                    <button onClick={(e) => handleRemoveItem(item.id, e)} className="w-5 h-5 bg-gray-200 hover:bg-red-200 text-gray-600 hover:text-red-600 rounded-full flex items-center justify-center">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </motion.div>
          )}
                    </AnimatePresence>
                </div>
      }
        </div>);

}
