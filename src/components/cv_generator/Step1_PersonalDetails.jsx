import React, { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronsUpDown } from 'lucide-react';
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


const PillInput = ({ name, placeholder, value, onChange, type = "text", className, ...props }) => (
  <Input
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    type={type}
    className={cn("w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400", className)}
    {...props}
  />
);

const PillSelect = ({ name, placeholder, value, onValueChange, children }) => (
  <Select name={name} value={value} onValueChange={onValueChange}>
    <SelectTrigger className="w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {children}
    </SelectContent>
  </Select>
);

const getBirthDateValue = (source) => source?.birth_date || source?.birthDate || '';
const REQUIRED_FIELDS = ['firstName', 'lastName', 'phone', 'address', 'birthDate', 'gender'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isFormComplete = (formData) => (
  REQUIRED_FIELDS.every((field) => {
    const fieldValue = formData?.[field];
    if (field === 'birthDate') {
      return typeof fieldValue === 'string' && DATE_REGEX.test(fieldValue.trim());
    }
    if (typeof fieldValue === 'string') {
      return fieldValue.trim().length > 0;
    }
    return Boolean(fieldValue);
  })
);

export default function Step1_PersonalDetails({ data, setData, user, onValidityChange = () => { } }) {
  const [localData, setLocalData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    is_phone_verified: false
  });

  const [openLocation, setOpenLocation] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);

  const notifyValidity = useCallback((formState) => {
    onValidityChange(isFormComplete(formState));
  }, [onValidityChange]);

  useEffect(() => {
    // Initialize local state from parent data or user data
    const fullName = data?.full_name || user?.full_name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const savedAddress = data?.address || user?.preferred_location || '';
    const isValidAddress = locationsList.includes(savedAddress);

    const initialState = {
      firstName: firstName,
      lastName: lastName,
      phone: data?.phone || user?.phone || '',
      address: isValidAddress ? savedAddress : '',
      birthDate: getBirthDateValue(data) || '',
      address: isValidAddress ? savedAddress : '',
      birthDate: getBirthDateValue(data) || '',
      gender: data?.gender || '',
      is_phone_verified: data?.is_phone_verified || false
    };

    setLocalData(initialState);
    notifyValidity(initialState);
  }, [data, user, notifyValidity]);

  const updateParentData = (key, value, currentLocalData) => {
    setData(parentData => {
      const newParentData = { ...(parentData || {}) };
      if (key === 'firstName' || key === 'lastName') {
        newParentData.full_name = `${currentLocalData.firstName} ${currentLocalData.lastName}`.trim();
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
    const nextValue = name === 'birthDate' && sanitizedValue && !DATE_REGEX.test(sanitizedValue)
      ? ''
      : sanitizedValue;

    setLocalData(prev => {
      const updatedLocal = { ...prev, [name]: nextValue };
      updateParentData(name, nextValue, updatedLocal);
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

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const maxBirthDate = formatDateForInput(new Date(today.getFullYear() - 15, today.getMonth(), today.getDate()));
  const minBirthDate = formatDateForInput(new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()));

  const handleSelectChange = (value) => {
    setLocalData(prev => {
      const updatedLocal = { ...prev, gender: value };
      updateParentData('gender', value, updatedLocal);
      notifyValidity(updatedLocal);
      return updatedLocal;
    });
  };

  return (
    <div className="max-w-4xl mx-auto text-center" dir="rtl">
      <h2 className="text-3xl font-bold text-gray-900 mb-3">פרטים אישיים</h2>
      <p className="text-gray-600 mb-12 max-w-lg mx-auto">בחלק הזה תספקו לנו מידע נחוץ עליכם כך שמעסיקים פוטנציאליים יוכלו לפנות אליכם</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
        {/* Row 1 */}
        <PillInput name="firstName" placeholder="שם פרטי" value={localData.firstName} onChange={handleInputChange} />
        <PillInput name="lastName" placeholder="שם משפחה" value={localData.lastName} onChange={handleInputChange} />
        <div className="relative">
          <div className="relative">
            <PillInput
              name="phone"
              placeholder="מספר טלפון"
              value={localData.phone}
              onChange={handleInputChange}
              className="pl-36"
              disabled={localData.is_phone_verified}
            />
            <Button
              type="button"
              onClick={() => setIsVerificationOpen(true)}
              className={`absolute left-1.5 top-1/2 -translate-y-1/2 h-8 px-4 text-xs font-medium rounded-full transition-all ${localData.is_phone_verified
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-[#1e88e5] text-white hover:bg-[#1565c0]'
                }`}
            >
              {localData.is_phone_verified ? 'אומת ✓' : 'שלח קוד'}
            </Button>
          </div>
          {!localData.is_phone_verified && (
            <p
              onClick={() => setIsVerificationOpen(true)}
              className="text-xs text-[#1e88e5] font-medium cursor-pointer mt-2 text-right w-full hover:underline mr-4"
            >
              לא קיבלתי שלח שוב
            </p>
          )}
        </div>

        {/* Row 2 */}
        <PillSelect name="gender" placeholder="מגדר" value={localData.gender} onValueChange={handleSelectChange}>
          <SelectItem value="male">זכר</SelectItem>
          <SelectItem value="female">נקבה</SelectItem>
          <SelectItem value="other">אחר</SelectItem>
        </PillSelect>

        <Popover open={openLocation} onOpenChange={setOpenLocation}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openLocation}
              className="w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400 justify-between font-normal hover:bg-white"
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

        <PillInput
          name="birthDate"
          placeholder="תאריך לידה"
          value={localData.birthDate}
          onChange={handleInputChange}
          type={localData.birthDate ? 'date' : 'text'}
          min={minBirthDate}
          max={maxBirthDate}
          onFocus={(e) => { e.target.type = 'date'; }}
          onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
        />
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
