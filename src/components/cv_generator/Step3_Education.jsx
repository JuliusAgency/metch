import React, { useState } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PillInput = ({ name, placeholder, value, onChange, type = "text", disabled = false, onFocus, onBlur }) =>
  <Input
    name={name}
    placeholder={placeholder}
    value={value || ''}
    onChange={onChange}
    type={type}
    disabled={disabled}
    onFocus={onFocus}
    onBlur={onBlur}
    className="w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400" />;



const PillSelect = ({ name, placeholder, value, onValueChange, children }) =>
  <Select name={name} value={value || ''} onValueChange={onValueChange}>
    <SelectTrigger className="w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {children}
    </SelectContent>
  </Select>;


const newEducationItem = () => ({
  id: `edu_${Date.now()}_${Math.random()}`,
  institution: '',
  education_type: '',
  degree: '',
  start_date: '',
  end_date: '',
  is_current: false,
  description: ''
});

export default function Step3_Education({ data, setData, onDirtyChange }) {
  const [currentItem, setCurrentItem] = useState(newEducationItem());

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentItem((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (name, value) => {
    setCurrentItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const requiredFields = [
      { key: 'institution', label: 'שם מוסד' },
      { key: 'education_type', label: 'סוג השכלה' },
      { key: 'degree', label: 'תחום השכלה' },
      { key: 'start_date', label: 'תאריך התחלה' }
    ];

    const missingFields = requiredFields
      .filter(field => !currentItem[field.key])
      .map(field => field.label);

    if (!currentItem.is_current && !currentItem.end_date) {
      missingFields.push('תאריך סיום');
    }

    if (missingFields.length > 0) {
      toast.error(`נא למלא שדות חובה: ${missingFields.join(', ')}`);
      return;
    }

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
    setCurrentItem(newEducationItem());
  };

  const handleSelectItem = (itemToSelect) => {
    handleSave();
    setCurrentItem(itemToSelect);
  };

  const handleRemoveItem = (idToRemove, e) => {
    e.stopPropagation();
    setData((prevData) => (prevData || []).filter((item) => item.id !== idToRemove));
    if (currentItem.id === idToRemove) {
      setCurrentItem(newEducationItem());
    }
  };

  const checkDirty = (item) => {
    return !!(item.institution || item.education_type || item.degree || item.start_date || item.end_date || item.description);
  };

  React.useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(checkDirty(currentItem));
    }
  }, [currentItem, onDirtyChange]);

  return (
    <div className="max-w-4xl mx-auto text-center" dir="rtl">
      <h2 className="text-3xl font-bold text-gray-900 mb-3">השכלה</h2>
      <p className="text-gray-600 mb-12 max-w-lg mx-auto">בחלק הזה תציגו את ההשכלה הבסיסית והאקדמית שלכם</p>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PillInput name="institution" placeholder="שם מוסד" value={currentItem.institution} onChange={handleInputChange} />
          <PillSelect name="education_type" placeholder="סוג השכלה" value={currentItem.education_type} onValueChange={(value) => handleSelectChange('education_type', value)}>
            <SelectItem value="high_school">לימודי תיכון</SelectItem>
            <SelectItem value="certificate">תעודה</SelectItem>
            <SelectItem value="bachelors">תואר ראשון</SelectItem>
            <SelectItem value="masters">תואר שני</SelectItem>
            <SelectItem value="phd">דוקטורט</SelectItem>
          </PillSelect>
          <PillInput name="degree" placeholder="תחום השכלה" value={currentItem.degree} onChange={handleInputChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PillInput type="text" name="start_date" placeholder="תאריך התחלה" value={currentItem.start_date} onChange={handleInputChange} onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} />
          <PillInput type="text" name="end_date" placeholder="תאריך סיום" value={currentItem.end_date} onChange={handleInputChange} disabled={currentItem.is_current} onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} />
        </div>
        <div className="flex items-center gap-2 justify-center">
          <input type="checkbox" id={`is_current_edu_${currentItem.id}`} name="is_current" checked={currentItem.is_current} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor={`is_current_edu_${currentItem.id}`} className="text-sm font-medium text-gray-700">אני לומד/ת כאן כיום</label>
        </div>
        <Textarea
          name="description"
          placeholder="הערות"
          value={currentItem.description}
          onChange={handleInputChange}
          className="w-full bg-white border-gray-200 rounded-xl p-4 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400 min-h-[120px]" />
      </div>

      <div className="mt-6 flex justify-between gap-4">
        <Button variant="link" className="text-blue-600 font-semibold" onClick={handleSave}>
          <Plus className="w-4 h-4 ml-2" />
          {data.find((i) => i.id === currentItem.id) ? 'עדכון השכלה' : 'הוספת השכלה'}
        </Button>
        <Button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
        >
          שמור
        </Button>
      </div>

      {data && data.length > 0 &&
        <div className="mt-8 p-4 bg-gray-50/70 border border-gray-200/90 rounded-2xl flex flex-wrap justify-start gap-3">
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


                  <span className="font-medium text-sm text-gray-700">{item.institution || 'השכלה חדשה'}</span>
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