import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Check, ChevronsUpDown, Calendar as CalendarIcon, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StepIndicator from '@/components/ui/StepIndicator';
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

const CATEGORIES = ["מכירות", "שירות לקוחות", "תמיכה טכנית", "ניהול משרד"];
const JOB_TYPES = ["גמיש", "מלאה", "חלקית", "משמרות"];
const AVAILABILITIES = ["גמיש", "מיידי", "שבוע עד שבועיים", "חודש עד חודשיים"];
const AVAILABILITY_MAPPING = {
  "גמיש": "negotiable",
  "גמישה": "negotiable",
  "מיידי": "immediate",
  "מיידית": "immediate",
  "שבוע עד שבועיים": "two_weeks",
  "חודש עד חודשיים": "one_month"
};

export default function Step2_WorkExperience({ data, setData, onDirtyChange, isUploadFlow = false }) {
  // --- PREFERENCES LOGIC (Upload Flow) ---
  if (isUploadFlow) {
    const formData = {
      categories: data?.categories || [],
      profession: data?.profession || '',
      area: data?.area || '',
      jobTypes: data?.jobTypes || [],
      availability: data?.availability || ''
    };

    const handleChange = (key, value) => {
      setData({ ...formData, [key]: value });
    };

    const handleCategoryToggle = (cat) => {
      const newCats = formData.categories.includes(cat)
        ? formData.categories.filter(c => c !== cat)
        : [...formData.categories, cat];
      handleChange('categories', newCats);
    };

    const handleJobTypeToggle = (type) => {
      const newTypes = formData.jobTypes.includes(type)
        ? formData.jobTypes.filter(t => t !== type)
        : [...formData.jobTypes, type];
      handleChange('jobTypes', newTypes);
    };

    return (
      <div className="max-w-4xl mx-auto text-center" dir="rtl">
        {/* Mobile Header: Title + Progress Bar Outside Card */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4 md:hidden">ההעדפות שלך</h2>

        <div className="md:hidden mb-8">
          <StepIndicator totalSteps={5} currentStep={2} />
        </div>

        {/* Card Wrapper (Preferences) */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.1)] border border-gray-100 mx-3 md:mx-0">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">באיזה תחום?</h3>

          {/* Categories Grid */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryToggle(cat)}
                className={`py-2 px-1 rounded-full text-[11px] font-medium border transition-all truncate ${formData.categories.includes(cat)
                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-blue-200 text-gray-600 hover:border-blue-400'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Dropdowns / Inputs */}
          <div className="space-y-4 mb-8">
            <div className="relative">
              <Select value={formData.profession} onValueChange={(val) => handleChange('profession', val)}>
                <SelectTrigger className="w-full h-12 rounded-full text-right px-6 border-gray-200 bg-white shadow-none focus:ring-0 focus:border-gray-300">
                  <SelectValue placeholder="חפש מקצוע" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {/* Placeholder items since no list provided yet */}
                  <SelectItem value="dev">פיתוח תוכנה</SelectItem>
                  <SelectItem value="design">עיצוב גרפי</SelectItem>
                  <SelectItem value="marketing">שיווק</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Select value={formData.area} onValueChange={(val) => handleChange('area', val)}>
                <SelectTrigger className="w-full h-12 rounded-full text-right px-6 border-gray-200 bg-white shadow-none focus:ring-0 focus:border-gray-300">
                  <SelectValue placeholder="איזור או עיר" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {locationsList.slice(0, 10).map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Types */}
          <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">סוג משרה</h4>
          <div className="grid grid-cols-4 gap-2 mb-8">
            {JOB_TYPES.map(type => (
              <button
                key={type}
                onClick={() => handleJobTypeToggle(type)}
                className={`py-2 px-1 rounded-full text-xs font-medium border transition-all ${formData.jobTypes.includes(type)
                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-blue-200 text-gray-600 hover:border-blue-400'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Availability */}
          <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">זמינות</h4>
          <div className="grid grid-cols-4 gap-2 mb-8">
            {AVAILABILITIES.map(avail => (
              <button
                key={avail}
                onClick={() => handleChange('availability', AVAILABILITY_MAPPING[avail] || avail)}
                className={`py-2 px-1 rounded-full text-[10px] font-medium border transition-all whitespace-normal h-10 flex items-center justify-center leading-tight ${(formData.availability === avail || formData.availability === (AVAILABILITY_MAPPING[avail] || avail))
                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-blue-200 text-gray-600 hover:border-blue-400'
                  }`}
              >
                {avail}
              </button>
            ))}
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 text-gray-500 text-xs text-right bg-blue-50/50 p-3 rounded-lg mb-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            <p>ההתאמה נעשית בהתבסס על קורות החיים, גם אם שאלון ההעדפה לא מדוייק</p>
          </div>
        </div>
      </div>
    );
  }

  // --- REGULAR Work Experience Logic (Create Flow) ---
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

      <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.08)] mx-3 md:mx-0 space-y-6">
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
                <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm hover:bg-white justify-between font-normal",
                !currentItem.start_date && "text-muted-foreground"
              )}
            >
              <span className="flex-1 text-right ml-2 text-gray-500">
                {(currentItem.start_date || currentItem.end_date) ? (
                  <span className="text-gray-900">
                    {currentItem.start_date} {currentItem.start_date && (currentItem.end_date || currentItem.is_current) ? '-' : ''} {currentItem.is_current ? 'כיום' : currentItem.end_date}
                  </span>
                ) : "תאריך התחלה וסיום"}
              </span>
              <CalendarIcon className="h-4 w-4 text-blue-500 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-white" align="center">
            <div className="grid gap-4 space-y-2">
              <div className="space-y-2">
                <h4 className="font-medium leading-none text-right">תקופת העסקה</h4>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <span className="text-sm font-medium text-right">תאריך התחלה</span>
                  <Input
                    type="date"
                    name="start_date"
                    value={currentItem.start_date}
                    onChange={handleInputChange}
                    className="text-right"
                  />
                </div>
                <div className="grid gap-2">
                  <span className="text-sm font-medium text-right">תאריך סיום</span>
                  <Input
                    type="date"
                    name="end_date"
                    value={currentItem.end_date}
                    onChange={handleInputChange}
                    disabled={currentItem.is_current}
                    className="text-right"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
        <div className="flex justify-start mt-4">
          <Button variant="link" className="text-blue-600 font-semibold p-0 h-auto" onClick={handleSave}>
            <Plus className="w-4 h-4 ml-1" />
            {data.find((i) => i.id === currentItem.id) ? 'עדכון ניסיון' : 'הוספת ניסיון'}
          </Button>
        </div>
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
    </div >);

}
