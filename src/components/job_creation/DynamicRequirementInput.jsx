

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export default function DynamicRequirementInput({ label, placeholder, items = [], setItems, onPendingChange }) {
  const [inputValue, setInputValue] = useState("");
  const [currentType, setCurrentType] = useState("required");

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];

  const handleAddItem = () => {
    if (inputValue.trim() !== "") {
      const newItems = [...safeItems.filter(item => item.value.trim() !== ""), { value: inputValue.trim(), type: currentType }];
      setItems(newItems);
      setInputValue("");
      if (onPendingChange) onPendingChange("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  const handleRemoveItem = (index) => {
    const newItems = safeItems.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (onPendingChange) onPendingChange(value);
  };

  // Clean up empty items
  React.useEffect(() => {
    const cleanedItems = safeItems.filter(item => item.value && item.value.trim() !== "");
    if (cleanedItems.length !== safeItems.length) {
      setItems(cleanedItems);
    }
  }, [items, setItems]); // Keep dependency on items to react to prop changes

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-full">
            <Button
              type="button"
              onClick={() => setCurrentType("required")}
              className={`px-4 h-9 rounded-full text-sm font-semibold transition-colors ${currentType === 'required' ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-gray-600'
                }`}
            >
              חובה
            </Button>
            <Button
              type="button"
              onClick={() => setCurrentType("advantage")}
              className={`px-4 h-9 rounded-full text-sm font-semibold transition-colors ${currentType === 'advantage' ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-gray-600'
                }`}
            >
              יתרון
            </Button>
          </div>
          <Input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="h-11 rounded-full border-gray-300 text-right"
            dir="rtl"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleAddItem}
        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
      >
        + הוסף {label}
      </button>

      {safeItems.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <AnimatePresence>
            {safeItems.map((item, index) => (
              item.value && (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 bg-green-100/60 text-green-900 rounded-lg px-3 py-1.5"
                >
                  <span>{item.value}</span>
                  <button type="button" onClick={() => handleRemoveItem(index)} className="text-green-900/70 hover:text-green-900">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
