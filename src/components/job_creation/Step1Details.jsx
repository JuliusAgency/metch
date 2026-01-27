import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import DynamicRequirementInput from './DynamicRequirementInput';
import jobCategoryList from '../../../jobs_category.json';
import jobTitles from '../../../jobs.json';
import locations from '../../../locations.json';
import CategorySelect from './CategorySelect';
import jobTaxonomy from '../../job_taxonomy.json';

export default function Step1Details({ jobData, setJobData }) {


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setJobData(prev => ({ ...prev, [name]: value }));
  };

  const handleDynamicChange = (name, items) => {
    setJobData(prev => ({ ...prev, [name]: items }));
  };

  const jobTypes = [
    { value: "full_time", label: "מלאה" },
    { value: "part_time", label: "חלקית" },
    { value: "shifts", label: "משמרות" },
    { value: "flexible", label: "גמיש/ה" }
  ];
  const categoryOptions = Array.isArray(jobCategoryList)
    ? jobCategoryList.filter(Boolean).filter((category, index, arr) => arr.indexOf(category) === index)
    : [];

  const getTitleOptions = () => {
    if (jobData.category && jobTaxonomy[jobData.category]) {
      return jobTaxonomy[jobData.category];
    }
    return Array.isArray(jobTitles)
      ? jobTitles.filter(Boolean).filter((title, index, arr) => arr.indexOf(title) === index)
      : [];
  };

  const titleOptions = getTitleOptions();

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#001a6e]">משרה מפורטת מובילה למועמדים מדוייקים</h1>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <CategorySelect
            value={jobData.category || ''}
            onChange={(value) => handleSelectChange('category', value)}
            options={categoryOptions}
            placeholder="תחום משרה"
          />
          <CategorySelect
            value={jobData.title || ''}
            onChange={(value) => handleSelectChange('title', value)}
            options={titleOptions}
            placeholder="תפקיד"
          />
          <Select
            value={jobData.start_date || ''}
            onValueChange={(value) => handleSelectChange('start_date', value)}
          >
            <SelectTrigger className="h-10 rounded-full border-gray-300 text-right flex flex-row-reverse">
              <SelectValue placeholder="תחילת עבודה" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="flexible" className="justify-end">גמיש/ה</SelectItem>
              <SelectItem value="immediate" className="justify-end">מיידית</SelectItem>
              <SelectItem value="1_2_weeks" className="justify-end">שבוע עד שבועיים</SelectItem>
              <SelectItem value="1_2_months" className="justify-end">חודש עד חודשיים</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select
            value={jobData.employment_type || ''}
            onValueChange={(value) => handleSelectChange('employment_type', value)}
          >
            <SelectTrigger className="h-10 rounded-full border-gray-300 text-right flex flex-row-reverse">
              <SelectValue placeholder="סוג המשרה" />
            </SelectTrigger>
            <SelectContent align="end">
              {jobTypes.map(type => (
                <SelectItem key={type.value} value={type.value} className="justify-end">{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CategorySelect
            value={jobData.location || ''}
            onChange={(value) => handleSelectChange('location', value)}
            options={locations}
            placeholder="מיקום המשרה"
            searchPlaceholder="חיפוש מיקום..."
          />
        </div>

        <div className="relative">
          <div className="absolute top-3 -right-8 pointer-events-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-black text-white p-3 text-right border-none" side="left">
                  <p className="text-sm leading-relaxed">כאן ממלאים את הפתיח ומידע נוסף כגון: תיאור התפקיד/המשרה, תחומי אחריות, שכר צפוי וכל מידע שתרצו לשתף על המשרה או החברה.<br />שימו לב - כאן לא מוסיפים דרישות יתרון או חובה לתפקיד.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            name="description"
            placeholder="תיאור התפקיד"
            value={jobData.description || ''}
            onChange={handleInputChange}
            className="min-h-[110px] max-h-96 resize-y rounded-3xl border-gray-300 text-right w-full p-4"
          />
        </div>

        <div className="space-y-6">
          <DynamicRequirementInput
            label="דרישה"
            placeholder="דרישות"
            items={jobData.structured_requirements}
            setItems={(items) => handleDynamicChange('structured_requirements', items)}
            infoText={<>כאן ניתן להוסיף כל דרישה שהיא חובה או יתרון - כגון ניסיון, הכשרה או יכולת מסויימת.<br />שימו לב - כאן לא מוסיפים דרישות השכלה או הסמכה</>}
          />
          <DynamicRequirementInput
            label="השכלה"
            placeholder="השכלה"
            items={jobData.structured_education}
            setItems={(items) => handleDynamicChange('structured_education', items)}
            infoText={<>כאן ניתן להוסיף כל דרישת השכלה שהיא חובה או יתרון כגון תואר אקדמי, בגרות או קורס מעשי.<br />שימו לב - כאן מוסיפים אך ורק דרישות השכלה</>}
          />
          <DynamicRequirementInput
            label="הסמכה"
            placeholder="הסמכות"
            items={jobData.structured_certifications}
            setItems={(items) => handleDynamicChange('structured_certifications', items)}
            infoText={<>כאן ניתן להוסיף כל דרישת הסמכה/רישיון שהיא חובה או יתרון - כגון רישיון נשק, עריכת דין וכל מקצוע שנדרשת הסמכה מיוחדת על מנת לעסוק בו.<br />שימו לב - כאן מוסיפים אך ורק דרישות הסמכות או רישיונות</>}
          />
        </div>
      </div>
    </div>
  );
}
