import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PillSelect = ({ name, placeholder, value, onValueChange, children }) => (
    <Select name={name} value={value} onValueChange={onValueChange}>
        <SelectTrigger className="flex items-center justify-between border py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400">
            <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
            {children}
        </SelectContent>
    </Select>
);

const CERTIFICATION_LABELS = {
    cpa: "רואה חשבון (CPA)",
    pmp: "מנהל פרויקטים (PMP)",
    aws_architect: "אדריכל ענן (AWS)",
    google_analytics: "Google Analytics IQ",
    other: "אחר (נא לפרט בהערות)",
};

const newCertificationItem = () => ({
    id: `cert_${Date.now()}_${Math.random()}`,
    name: '',
    notes: '',
    type: ''
});

export default function Step4_Certifications({ data, setData, onDirtyChange }) {
    const [currentItem, setCurrentItem] = useState(newCertificationItem());

    const deriveType = (item) => {
        if (!item) return '';
        if (item.type) return item.type;
        if (CERTIFICATION_LABELS[item.name]) return item.name;
        if (item.name === 'other') return 'other';
        if (item.name) return 'other';
        return '';
    };

    const handleCurrentItemChange = (field, value) => {
        setCurrentItem(prev => ({ ...prev, [field]: value }));
    };

    const handleTypeChange = (value) => {
        setCurrentItem(prev => ({
            ...prev,
            type: value,
            name: value === 'other'
                ? (prev.type === 'other' ? prev.name : '')
                : value
        }));
    };

    const handleSave = () => {
        const selectedType = deriveType(currentItem);

        if (!selectedType) return;

        const isOther = selectedType === 'other';
        const trimmedNotes = currentItem.notes?.trim() || '';

        if (isOther && !trimmedNotes) return;

        const itemToSave = {
            ...currentItem,
            type: selectedType,
            name: isOther ? trimmedNotes : selectedType
        };

        const existingItemIndex = (data || []).findIndex(item => item.id === currentItem.id);

        if (existingItemIndex > -1) {
            setData(prevData => {
                const newData = [...(prevData || [])];
                newData[existingItemIndex] = itemToSave;
                return newData;
            });
        } else {
            setData(prevData => [...(prevData || []), itemToSave]);
        }
        setCurrentItem(newCertificationItem());
    };

    const handleSelectItem = (itemToSelect) => {
        handleSave();
        const derivedType = deriveType(itemToSelect);
        setCurrentItem({ ...itemToSelect, type: derivedType });
    };

    const handleRemoveItem = (idToRemove, e) => {
        e.stopPropagation();
        setData(prevData => (prevData || []).filter(item => item.id !== idToRemove));
        if (currentItem.id === idToRemove) {
            setCurrentItem(newCertificationItem());
        }
    };

    const getCertificationName = (item) => {
        if (!item) return 'הסמכה חדשה';
        const type = deriveType(item);

        if (type === 'other') {
            if (item.name && item.name !== 'other' && !CERTIFICATION_LABELS[item.name]) {
                return item.name;
            }
            return item.notes?.trim() || CERTIFICATION_LABELS.other;
        }

        return CERTIFICATION_LABELS[type] || item.name || 'הסמכה חדשה';
    };

    const checkDirty = (item) => {
        return !!(item.name || item.notes || item.type);
    };

    React.useEffect(() => {
        if (onDirtyChange) {
            onDirtyChange(checkDirty(currentItem));
        }
    }, [currentItem, onDirtyChange]);

    return (
        <div className="max-w-4xl mx-auto text-center" dir="rtl">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">הסמכות מקצועיות ורישיונות</h2>
            <p className="text-gray-600 mb-12 max-w-lg mx-auto">בחלק הזה תציינו בנוסף להשכלתכם הסמכות מקצועיות</p>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PillSelect
                        name="name"
                        placeholder="בחר הסמכה"
                        value={deriveType(currentItem) || ''}
                        onValueChange={handleTypeChange}>
                        <SelectItem value="cpa">{CERTIFICATION_LABELS.cpa}</SelectItem>
                        <SelectItem value="pmp">{CERTIFICATION_LABELS.pmp}</SelectItem>
                        <SelectItem value="aws_architect">{CERTIFICATION_LABELS.aws_architect}</SelectItem>
                        <SelectItem value="google_analytics">{CERTIFICATION_LABELS.google_analytics}</SelectItem>
                        <SelectItem value="other">{CERTIFICATION_LABELS.other}</SelectItem>
                    </PillSelect>
                </div>
                <Textarea
                    name="notes"
                    placeholder="הערות"
                    value={currentItem.notes || ''}
                    onChange={(e) => handleCurrentItemChange('notes', e.target.value)}
                    className="w-full bg-white border-gray-200 rounded-xl p-4 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400 min-h-[120px]" />
            </div>

            <div className="mt-6 flex justify-between gap-4">
                <Button variant="link" className="text-blue-600 font-semibold" onClick={handleSave}>
                    <Plus className="w-4 h-4 ml-2" />
                    {(data || []).find(i => i.id === currentItem.id) ? 'עדכן הסמכה' : 'הוסף הסמכה'}
                </Button>
                <Button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
                >
                    שמור
                </Button>
            </div>

            {data && data.length > 0 && (
                <div className="mt-8 p-4 bg-gray-50/70 border border-gray-200/90 rounded-2xl flex flex-wrap justify-start gap-3">
                    <AnimatePresence>
                        {data.map(item => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}>
                                <div
                                    onClick={() => handleSelectItem(item)}
                                    className="flex items-center gap-2 pl-2 pr-4 py-2 rounded-full cursor-pointer transition-colors bg-[#EDF8EF]">
                                    <span className="font-medium text-sm text-gray-700">{getCertificationName(item)}</span>
                                    <button onClick={(e) => handleRemoveItem(item.id, e)} className="w-5 h-5 bg-gray-200 hover:bg-red-200 text-gray-600 hover:text-red-600 rounded-full flex items-center justify-center">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
