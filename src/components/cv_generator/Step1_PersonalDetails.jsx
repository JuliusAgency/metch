import React, { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronsUpDown, Calendar } from 'lucide-react';
import { toast } from "sonner";
import { WhatsAppVerificationDialog } from "@/components/dialogs/WhatsAppVerificationDialog";
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
import StepIndicator from '@/components/ui/StepIndicator';


const PillInput = React.forwardRef(({ name, placeholder, value, onChange, type = "text", className, ...props }, ref) => (
  <Input
    ref={ref}
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    type={type}
    className={cn("w-full h-12 md:h-10 bg-white border-gray-200 rounded-full px-6 text-right focus:border-blue-400 focus:ring-blue-400", className)}
    {...props}
  />
));
PillInput.displayName = "PillInput";

const PillSelect = ({ name, placeholder, value, onValueChange, children }) => (
  <Select name={name} value={value} onValueChange={onValueChange}>
    <SelectTrigger className="w-full h-12 md:h-10 bg-white border-gray-200 rounded-full px-6 text-right focus:border-blue-400 focus:ring-blue-400 [&>span]:w-full [&>span]:text-right flex items-center justify-between">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {children}
    </SelectContent>
  </Select>
);

const getBirthDateValue = (source) => source?.birth_date || source?.birthDate || source?.date_of_birth || '';
const REQUIRED_FIELDS = ['fullName', 'phone', 'address', 'birthDate', 'gender'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isFormComplete = (formData) => {
  // Enforce phone verification
  if (!formData?.is_phone_verified) return false;

  return REQUIRED_FIELDS.every((field) => {
    const fieldValue = formData?.[field];
    if (field === 'birthDate') {
      return typeof fieldValue === 'string' && DATE_REGEX.test(fieldValue.trim());
    }
    if (typeof fieldValue === 'string') {
      return fieldValue.trim().length > 0;
    }
    return Boolean(fieldValue);
  });
};

export default function Step1_PersonalDetails({ data, setData, user, onValidityChange = () => { }, isUploadFlow = false }) {
  const birthDateRef = React.useRef(null);
  const [localData, setLocalData] = useState({
    firstName: '',
    lastName: '',
    fullName: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    is_phone_verified: false
  });

  const [openLocation, setOpenLocation] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isBirthDateFocused, setIsBirthDateFocused] = useState(false);

  const notifyValidity = useCallback((formState) => {
    onValidityChange(isFormComplete(formState));
  }, [onValidityChange]);

  // Helper to ensure date is in YYYY-MM-DD format for date inputs
  const sanitizeDateForInput = (input) => {
    if (!input) return '';
    if (input instanceof Date) {
      const year = input.getFullYear();
      const month = `${input.getMonth() + 1}`.padStart(2, '0');
      const day = `${input.getDate()}`.padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    if (typeof input !== 'string') return '';
    // If it's Hebrew format (DD/MM/YYYY), convert it
    if (input.includes('/')) {
      const parts = input.split('/');
      if (parts.length === 3 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return input.split('T')[0];
  };

  useEffect(() => {
    console.log("[Step1] Initializing with data:", { data, user });

    // TRUTH: Always prioritize existing form data (edits), fallback to user profile
    const fullName = data?.full_name || user?.full_name || '';
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const savedAddress = data?.address || user?.preferred_location || '';
    const isValidAddress = locationsList.includes(savedAddress);

    const profileBirthDate = getBirthDateValue(user);
    const cvBirthDate = getBirthDateValue(data);

    // For phone/gender, update prioritization too
    const phoneValue = data?.phone || user?.phone || '';
    const genderValue = data?.gender || user?.gender || '';

    const initialState = {
      firstName: firstName,
      lastName: lastName,
      fullName: fullName,
      phone: phoneValue,
      address: isValidAddress ? savedAddress : '',
      birthDate: sanitizeDateForInput(cvBirthDate || profileBirthDate), // Prioritize CV data for birthdate too
      gender: genderValue,
      is_phone_verified: data?.is_phone_verified || false
    };

    console.log("[Step1] Final Initial State:", initialState);
    setLocalData(initialState);
    notifyValidity(initialState);
  }, [data, user, notifyValidity]);

  const updateParentData = (key, value, currentLocalData) => {
    setData(parentData => {
      const newParentData = { ...(parentData || {}) };
      if (key === 'fullName') {
        newParentData.full_name = value;
      } else if (key === 'birthDate') {
        newParentData.birth_date = value;
      } else {
        newParentData[key] = value;
      }
      return newParentData;
    });
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Validations
    if (name === 'phone' && !/^\d*$/.test(value)) return;

    const sanitizedValue = name === 'birthDate' ? value.trim() : value;
    const nextValue = name === 'birthDate' && sanitizedValue && sanitizedValue.length < 10
      ? ''
      : sanitizedValue;

    setLocalData(prev => {
      const updatedLocal = { ...prev, [name]: nextValue };

      // If first or last name changed, update fullName
      if (name === 'firstName' || name === 'lastName') {
        const combined = `${updatedLocal.firstName} ${updatedLocal.lastName}`.trim();
        updatedLocal.fullName = combined;
        updateParentData('fullName', combined, updatedLocal);
      } else {
        updateParentData(name, nextValue, updatedLocal);
      }

      notifyValidity(updatedLocal);
      return updatedLocal;
    });
  };

  const handleVerified = (verifiedPhone) => {
    setLocalData(prev => {
      const updatedLocal = { ...prev, phone: verifiedPhone, is_phone_verified: true };

      // Update parent data
      updateParentData('phone', verifiedPhone, updatedLocal);
      updateParentData('is_phone_verified', true, updatedLocal);

      notifyValidity(updatedLocal);
      return updatedLocal;
    });
    setIsVerificationOpen(false);
    toast.success("הטלפון אומת בהצלחה");
  };

  const handleLocationChange = (value) => {
    setLocalData(prev => {
      const updatedLocal = { ...prev, address: value };
      updateParentData('address', value, updatedLocal);
      notifyValidity(updatedLocal);
      return updatedLocal;
    });
  };

  const today = new Date();
  const maxBirthDate = sanitizeDateForInput(new Date(today.getFullYear() - 15, today.getMonth(), today.getDate()));
  const minBirthDate = sanitizeDateForInput(new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()));

  const handleSelectChange = (value) => {
    setLocalData(prev => {
      const updatedLocal = { ...prev, gender: value };
      updateParentData('gender', value, updatedLocal);
      notifyValidity(updatedLocal);
      return updatedLocal;
    });
  };

  return (
    <div className={cn("max-w-4xl mx-auto text-center", isUploadFlow && "md:max-w-4xl md:w-full")} dir="rtl">
      <h2 className="text-3xl font-bold text-gray-900 mb-3">פרטים אישיים</h2>
      {isUploadFlow && (
        <div className="md:hidden mb-6 mt-8">
          <StepIndicator totalSteps={5} currentStep={1} />
        </div>
      )}
      <p className={cn("text-gray-600 mb-8 md:mb-10 max-w-lg mx-auto", isUploadFlow && "hidden md:block")}>בחלק הזה תספקו לנו מידע נחוץ עליכם כך שמעסיקים פוטנציאליים יוכלו לפנות אליכם</p>
      {/* Desktop (upload): no inner card. Mobile: keep inner card */}
      <div className={cn(
        "bg-white/40 backdrop-blur-sm rounded-3xl p-6 mx-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)] md:bg-transparent md:shadow-none md:rounded-none md:p-0 md:mx-0"
      )}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 md:grid-rows-2">
          {/* Desktop: First and Last name. Mobile: Full name */}
          <PillInput
            name="fullName"
            placeholder="שם מלא"
            value={localData.fullName}
            onChange={handleInputChange}
            className="order-1 md:hidden"
          />
          <PillInput
            name="firstName"
            placeholder="שם"
            value={localData.firstName}
            onChange={handleInputChange}
            className="hidden md:block md:col-start-1 md:row-start-1"
          />
          <PillInput
            name="lastName"
            placeholder="שם משפחה"
            value={localData.lastName}
            onChange={handleInputChange}
            className="hidden md:block md:col-start-2 md:row-start-1"
          />

          {/* Desktop: col 3 row 2 = phone + link only. Mobile: order 5 */}
          <div className="relative order-5 md:order-none md:col-start-3 md:row-start-2 md:flex md:flex-col md:gap-2">
            <div className="relative">
              <PillInput
                name="phone"
                placeholder="מספר טלפון"
                value={localData.phone}
                onChange={handleInputChange}
                className="pl-36 md:h-10"
                disabled={localData.is_phone_verified}
              />
              <Button
                type="button"
                onClick={() => setIsVerificationOpen(true)}
                disabled={localData.is_phone_verified}
                className={`absolute left-1.5 top-1/2 -translate-y-1/2 h-8 px-4 text-xs font-medium rounded-full transition-all ${localData.is_phone_verified
                  ? 'bg-green-500 text-white cursor-default'
                  : 'bg-[#1e88e5] text-white hover:bg-[#1565c0]'
                  }`}
              >
                {localData.is_phone_verified ? 'אומת ✓' : (isUploadFlow ? 'שלח קוד' : 'שליחת קוד')}
              </Button>
            </div>
            {!localData.is_phone_verified && (
              <p
                onClick={() => setIsVerificationOpen(true)}
                className="text-xs text-[#1e88e5] font-medium cursor-pointer mt-2 text-right w-full hover:underline mr-4"
              >
                לא קיבלתי שליחת קוד
              </p>
            )}
          </div>

          {/* Desktop (create flow): gender dropdown. Desktop (upload): use radio pills below. */}
          {!isUploadFlow && (
            <div className="hidden md:block md:col-start-3 md:row-start-1">
              <PillSelect name="gender" placeholder="מגדר" value={localData.gender} onValueChange={handleSelectChange}>
                <SelectItem value="male">זכר</SelectItem>
                <SelectItem value="female">נקבה</SelectItem>
                <SelectItem value="other">אחר</SelectItem>
              </PillSelect>
            </div>
          )}

          {/* Gender: mobile always radios; desktop when upload = split into cols 2 & 3 row 1 */}
          <div className={cn(
            "order-2 grid grid-cols-2 gap-4 md:contents",
            !isUploadFlow && "md:hidden"
          )}>
            <button
              type="button"
              onClick={() => handleSelectChange('male')}
              className={`h-12 md:h-10 rounded-full border flex items-center justify-between px-6 transition-all md:col-start-2 md:row-start-1 ${localData.gender === 'male'
                ? 'border-blue-500 text-blue-900 bg-white'
                : 'bg-white border-gray-200 text-gray-500'
                }`}
            >
              <span className="md:order-1">זכר</span>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center md:order-2 ${localData.gender === 'male' ? 'border-[#1e40af]' : 'border-gray-400'}`}>
                {localData.gender === 'male' && <div className="w-2.5 h-2.5 rounded-full bg-[#1e40af]" />}
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectChange('female')}
              className={`h-12 md:h-10 rounded-full border flex items-center justify-between px-6 transition-all md:col-start-3 md:row-start-1 ${localData.gender === 'female'
                ? 'border-blue-500 text-blue-900 bg-white'
                : 'bg-white border-gray-200 text-gray-500'
                }`}
            >
              <span className="md:order-1">נקבה</span>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center md:order-2 ${localData.gender === 'female' ? 'border-[#1e40af]' : 'border-gray-400'}`}>
                {localData.gender === 'female' && <div className="w-2.5 h-2.5 rounded-full bg-[#1e40af]" />}
              </div>
            </button>
          </div>

          {/* Desktop: col 1 row 2 = מקום מגורים. Mobile: order 3 */}
          <Popover open={openLocation} onOpenChange={setOpenLocation}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openLocation}
                className="w-full h-12 md:h-10 bg-white border-gray-200 rounded-full px-6 text-right focus:border-blue-400 focus:ring-blue-400 justify-between font-normal hover:bg-white order-3 md:col-start-1 md:row-start-2 md:flex md:items-center"
              >
                {localData.address || "מקום מגורים"}
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
                            localData.address === loc ? "opacity-100" : "opacity-0"
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

          {/* תאריך לידה: row 2 middle (desktop). Mobile: order 4 */}
          <div className="relative order-4 md:col-start-2 md:row-start-2 flex items-center h-12 md:h-10">
            <PillInput
              ref={birthDateRef}
              name="birthDate"
              value={localData.birthDate}
              onChange={handleInputChange}
              type="date"
              min={minBirthDate}
              max={maxBirthDate}
              onFocus={() => setIsBirthDateFocused(true)}
              onBlur={() => setIsBirthDateFocused(false)}
              className={cn(
                "pl-12 w-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-10",
                (!localData.birthDate && !isBirthDateFocused) && "text-transparent"
              )}
            />
            {(!localData.birthDate && !isBirthDateFocused) && (
              <span className="absolute right-6 text-gray-500 pointer-events-none text-sm md:text-base">
                תאריך לידה
              </span>
            )}
            <Calendar
              className="absolute left-4 h-5 w-5 text-blue-500 cursor-pointer"
              onClick={() => {
                if (birthDateRef.current) {
                  try {
                    if (birthDateRef.current.showPicker) {
                      birthDateRef.current.showPicker();
                    } else {
                      birthDateRef.current.focus();
                    }
                  } catch (e) {
                    birthDateRef.current.focus();
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <WhatsAppVerificationDialog
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        initialPhone={localData.phone}
        onVerified={handleVerified}
      />
    </div>
  );
}
