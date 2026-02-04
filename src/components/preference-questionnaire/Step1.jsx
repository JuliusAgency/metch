import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
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
import jobsList from '../../../jobs.json';
import locationsList from '../../../locations.json';

// Option constants
// Option constants
const JOB_TYPES = ["משמרות", "חלקית", "מלאה", "גמישה"];
const AVAILABILITIES = ["חודש עד חודשיים", "שבוע עד שבועיים", "מיידית", "גמישה"];
const AVAILABILITY_MAPPING = {
    "גמישה": "negotiable",
    "גמיש": "negotiable",
    "מיידית": "immediate",
    "מיידי": "immediate",
    "שבוע עד שבועיים": "two_weeks",
    "חודש עד חודשיים": "one_month"
};
const FIELDS = ["מכירות", "שירות לקוחות", "תמיכה טכנית", "ניהול משרד"];

const PillButton = ({ label, isSelected, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`
      px-0.5 py-2 md:px-6 md:py-2 rounded-full border transition-all duration-200 text-[9px] md:text-sm font-normal w-full md:w-auto whitespace-nowrap
      ${isSelected
                ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                : 'bg-white border-blue-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50/50'
            }
    `}
    >
        {label}
    </button>
);

const uniqueLocations = [...new Set(locationsList)];
const uniqueJobs = [...new Set(jobsList)];

export default function Step1({
    preferences,
    setPreferences,
    onNext
}) {
    const [openProfession, setOpenProfession] = React.useState(false);
    const [openLocation, setOpenLocation] = React.useState(false);

    const handleSelection = (category, value) => {
        let finalValue = value;
        if (category === 'availability' && AVAILABILITY_MAPPING[value]) {
            finalValue = AVAILABILITY_MAPPING[value];
        }

        setPreferences(prev => ({
            ...prev,
            [category]: prev[category] === (finalValue || value) ? '' : (finalValue || value)
        }));
    };

    const handleChange = (field, value) => {
        setPreferences(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex flex-col items-center text-center space-y-3 md:space-y-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Field Selection Section - NEW */}
            <div className="w-full space-y-2 md:space-y-6">
                <h2 className="text-lg md:text-3xl font-bold text-gray-900">באיזה תחום?</h2>
                <div className="grid grid-cols-4 gap-1 md:flex md:flex-wrap md:justify-center md:gap-4">
                    {FIELDS.map(field => (
                        <PillButton
                            key={field}
                            label={field}
                            isSelected={preferences.field === field}
                            onClick={() => handleSelection('field', field)}
                        />
                    ))}
                </div>
            </div>

            {/* Dropdowns Section */}
            <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location Select - Right in RTL */}
                <Popover open={openLocation} onOpenChange={setOpenLocation}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openLocation}
                            className="h-10 md:h-12 w-full justify-between rounded-full border-gray-200 text-right px-4 md:px-6 text-xs md:text-base text-gray-500 font-normal bg-white hover:bg-white"
                        >
                            {preferences.location
                                ? preferences.location
                                : "איזור או עיר"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start" dir="rtl">
                        <Command>
                            <CommandInput placeholder="חיפוש איזור או עיר..." className="text-right gap-2" />
                            <CommandList>
                                <CommandEmpty>לא נמצא מיקום.</CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-y-auto">
                                    {uniqueLocations.map((loc) => (
                                        <CommandItem
                                            key={loc}
                                            value={loc}
                                            onSelect={() => {
                                                handleChange('location', loc);
                                                setOpenLocation(false);
                                            }}
                                            className="text-right flex justify-between cursor-pointer"
                                        >
                                            <Check
                                                className={cn(
                                                    "h-4 w-4",
                                                    preferences.location === loc ? "opacity-100" : "opacity-0"
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

                {/* Profession Search/Select - Left in RTL */}
                <Popover open={openProfession} onOpenChange={setOpenProfession}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openProfession}
                            className="h-10 md:h-12 w-full justify-between rounded-full border-gray-200 text-right px-4 md:px-6 text-xs md:text-base text-gray-500 font-normal bg-white hover:bg-white"
                        >
                            {preferences.profession_search
                                ? preferences.profession_search
                                : "חיפוש מקצוע"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start" dir="rtl">
                        <Command>
                            <CommandInput placeholder="חיפוש מקצוע..." className="text-right gap-2" />
                            <CommandList>
                                <CommandEmpty>לא נמצא מקצוע.</CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-y-auto">
                                    {uniqueJobs.map((job) => (
                                        <CommandItem
                                            key={job}
                                            value={job}
                                            onSelect={() => {
                                                handleChange('profession_search', job);
                                                setOpenProfession(false);
                                            }}
                                            className="text-right flex justify-between cursor-pointer"
                                        >
                                            <Check
                                                className={cn(
                                                    "h-4 w-4",
                                                    preferences.profession_search === job ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {job}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Job Type Section */}
            <div className="w-full space-y-2 md:space-y-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900">סוג המשרה</h3>
                <div className="grid grid-cols-4 gap-1 md:flex md:flex-wrap md:justify-center md:gap-4">
                    {JOB_TYPES.map(type => (
                        <PillButton
                            key={type}
                            label={type}
                            isSelected={preferences.job_type === type}
                            onClick={() => handleSelection('job_type', type)}
                        />
                    ))}
                </div>
            </div>

            {/* Availability Section */}
            <div className="w-full space-y-2 md:space-y-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900">זמינות</h3>
                <div className="grid grid-cols-4 gap-1 md:flex md:flex-wrap md:justify-center md:gap-4">
                    {AVAILABILITIES.map(avail => (
                        <PillButton
                            key={avail}
                            label={avail}
                            isSelected={preferences.availability === avail || preferences.availability === AVAILABILITY_MAPPING[avail]}
                            onClick={() => handleSelection('availability', avail)}
                        />
                    ))}
                </div>
            </div>

            {/* Submit Button */}
            <div className="pt-8 hidden md:block">
                <Button
                    onClick={onNext}
                    disabled={!preferences.location || !preferences.profession_search || !preferences.job_type || !preferences.availability}
                    className="bg-[#2987cd] hover:bg-[#1f6ba8] text-white rounded-full px-12 py-6 text-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    הבא
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </div>

        </div >
    );
}
