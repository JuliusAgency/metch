import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PillInput = ({ name, placeholder, value, onChange, type = "text" }) => (
    <Input
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        type={type}
        className="w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400"
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

export default function Step1_PersonalDetails({ data, setData, user }) {
  const [localData, setLocalData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: ''
  });

  useEffect(() => {
    // Initialize local state from parent data or user data
    const fullName = data?.full_name || user?.full_name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    setLocalData({
        firstName: firstName,
        lastName: lastName,
        phone: data?.phone || user?.phone || '',
        address: data?.address || user?.preferred_location || '',
        birthDate: data?.birth_date || '',
        gender: data?.gender || '',
    });
  }, [data, user]);

    const updateParentData = (key, value, currentLocalData) => {
         setData(parentData => {
            const newParentData = { ...parentData };
            if (key === 'firstName' || key === 'lastName') {
                newParentData.full_name = `${currentLocalData.firstName} ${currentLocalData.lastName}`.trim();
            } else {
                 newParentData[key] = value;
            }
            return newParentData;
        });
    }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalData(prev => {
        const updatedLocal = { ...prev, [name]: value };
        updateParentData(name, value, updatedLocal);
        return updatedLocal;
    });
  };

  const handleSelectChange = (value) => {
      setLocalData(prev => {
          const updatedLocal = {...prev, gender: value};
          updateParentData('gender', value, updatedLocal);
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
                <PillInput name="phone" placeholder="מספר טלפון" value={localData.phone} onChange={handleInputChange} />
                <Button className="absolute left-2 top-1/2 -translate-y-1/2 h-8 rounded-full px-4 text-xs bg-blue-600 hover:bg-blue-700">שלח קוד</Button>
                <p className="text-xs text-gray-500 mt-2 text-right mr-4">לא קיבלתי? <a href="#" className="text-blue-600 font-semibold">שלח שוב</a></p>
            </div>

            {/* Row 2 */}
            <PillSelect name="gender" placeholder="מגדר" value={localData.gender} onValueChange={handleSelectChange}>
                <SelectItem value="male">זכר</SelectItem>
                <SelectItem value="female">נקבה</SelectItem>
                <SelectItem value="other">אחר</SelectItem>
            </PillSelect>
            <PillInput name="address" placeholder="מקום מגורים" value={localData.address} onChange={handleInputChange} />
            <PillInput name="birthDate" placeholder="תאריך לידה" value={localData.birthDate} onChange={handleInputChange} onFocus={(e) => e.target.type='date'} onBlur={(e) => e.target.type='text'} />
        </div>
    </div>
  );
}