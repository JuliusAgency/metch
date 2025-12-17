import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
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
import certificationsList from '@/data/certifications.json';

const CERTIFICATION_LABELS = certificationsList.reduce((acc, curr) => {
    acc[curr.id] = curr.label;
    return acc;
}, {});

const newCertificationItem = () => ({
    id: `cert_${Date.now()}_${Math.random()}`,
    name: '',
    notes: '',
    type: ''
});

export default function Step4_Certifications({ data, setData, onDirtyChange }) {
    const [currentItem, setCurrentItem] = useState(newCertificationItem());
    const [open, setOpen] = useState(false);

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

    const handleTypeSelect = (currentValue) => {
        const value = currentValue; // The value from CommandItem should be the ID/Label key

        // Find label if possible
        const label = CERTIFICATION_LABELS[value] || value;

        setCurrentItem(prev => ({
            ...prev,
            type: value,
            name: value === 'other' ? '' : label
        }));
        setOpen(false);
    };

    const handleSave = () => {
        const selectedType = deriveType(currentItem);

        // Basic validation
        if (!selectedType && !currentItem.name && !currentItem.notes) return;

        // If "Other" is selected, we might want the name to be "Other" or blank, 
        // but the preview uses "name". 
        // If the user typed notes but not a name (for "Other"), we can use notes as name or "Certification"

        let finalName = currentItem.name;
        if (selectedType === 'other' || !finalName) {
            finalName = currentItem.name || "הסמכה נוספת";
        }

        // Ensure we save the notes!
        const trimmedNotes = currentItem.notes?.trim() || '';

        const itemToSave = {
            ...currentItem,
            type: selectedType || 'other',
            name: finalName,
            notes: trimmedNotes
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
        // First save current if valid? The original logic called handleSave() which might save incomplete data or just return.
        // The original logic: handleSave(); then select new. This implies auto-save of current before switching.
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
            // Logic from original file to display name for custom items
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

    const currentType = deriveType(currentItem);

    return (
        <div className="max-w-4xl mx-auto text-center" dir="rtl">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">הסמכות מקצועיות ורישיונות</h2>
            <p className="text-gray-600 mb-12 max-w-lg mx-auto">בחלק הזה תציינו בנוסף להשכלתכם הסמכות מקצועיות</p>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm hover:bg-white text-gray-700 font-normal"
                            >
                                {currentType
                                    ? CERTIFICATION_LABELS[currentType]
                                    : "בחר הסמכה..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start" dir="rtl">
                            <Command>
                                <CommandInput placeholder="חפש הסמכה..." className="text-right" />
                                <CommandList>
                                    <CommandEmpty>לא נמצאה הסמכה.</CommandEmpty>
                                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                                        {certificationsList.map((cert) => (
                                            <CommandItem
                                                key={cert.id}
                                                value={cert.label} // Filtering is usually done on value and keywords.
                                                onSelect={() => handleTypeSelect(cert.id)}
                                                className="text-right flex justify-between cursor-pointer"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        currentType === cert.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {cert.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
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
