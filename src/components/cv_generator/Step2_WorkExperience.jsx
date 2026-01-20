import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Check, ChevronsUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import locationsList from '../../../locations.json';

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

export default function Step2_WorkExperience({ data, setData, onDirtyChange }) {
  const [currentItem, setCurrentItem] = useState(newExperienceItem());
  const minDate = '1900-01-01';
  const today = new Date().toISOString().split('T')[0];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentItem((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const { toast } = useToast();

  const handleSave = () => {
    // Validation
    const isValid =
      currentItem.title?.trim() &&
      currentItem.company?.trim() &&
      currentItem.location?.trim() &&
      currentItem.start_date &&
      (currentItem.is_current || currentItem.end_date) &&
      currentItem.description?.trim();

    if (!isValid) {
      toast({
        title: "שגיאה בשמירה",
        description: "יש למלא את כל השדות (כולל תיאור) לפני השמירה.",
        variant: "destructive"
      });
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

  const [openLocation, setOpenLocation] = useState(false);

  const handleLocationChange = (value) => {
    setCurrentItem((prev) => ({ ...prev, location: value }));
  };

  const checkDirty = (item) => {
    return !!(item.title || item.company || item.location || item.start_date || item.end_date || item.description);
  };

  React.useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(checkDirty(currentItem));
    }
  }, [currentItem, onDirtyChange]);

  return (
    <div className="max-w-4xl mx-auto text-center" dir="rtl">
      <h2 className="text-3xl font-bold text-gray-900 mb-3">ניסיון תעסוקתי וצבאי</h2>
      <p className="text-gray-600 mb-12 max-w-lg mx-auto">בחלק זה יש לפרט על הניסיון התעסוקתי שלך</p>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PillInput name="title" placeholder="תפקיד" value={currentItem.title} onChange={handleInputChange} />
          <PillInput name="company" placeholder="שם חברה" value={currentItem.company} onChange={handleInputChange} />

          <Popover open={openLocation} onOpenChange={setOpenLocation}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openLocation}
                className="w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400 justify-between font-normal hover:bg-white"
              >
                {currentItem.location || "מיקום"}
                <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50 absolute left-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start" dir="rtl">
              <Command>
                <CommandInput placeholder="חיפוש עיר..." className="text-right gap-2" />
                <CommandList>
                  <CommandEmpty>לא נמצאה עיר.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-y-auto">
                    {locationsList.map((loc) => (
                      <CommandItem
                        key={loc}
                        value={loc}
                        onSelect={(currentValue) => {
                          handleLocationChange(currentValue);
                          setOpenLocation(false);
                        }}
                        className="text-right flex justify-between cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4",
                            currentItem.location === loc ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {loc}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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

      <div className="mt-6 flex justify-between gap-4">
        <Button variant="link" className="text-blue-600 font-semibold" onClick={handleSave}>
          <Plus className="w-4 h-4 ml-2" />
          {data.find((i) => i.id === currentItem.id) ? 'עדכון ניסיון' : 'הוספת ניסיון'}
        </Button>
        <Button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
        >
          שמור
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
