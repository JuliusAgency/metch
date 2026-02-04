import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Info } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function DynamicRequirementInput({ label, placeholder, items = [], setItems, infoText }) {
  const [inputValue, setInputValue] = useState("");
  const [currentType, setCurrentType] = useState("required");

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];

  const handleAddItem = () => {
    if (inputValue.trim() !== "") {
      const newItems = [...safeItems.filter(item => item.value.trim() !== ""), { value: inputValue.trim(), type: currentType }];
      setItems(newItems);
      setInputValue("");
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
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 w-full">
            {infoText && (
              <div className="shrink-0 block">
                <Popover>
                  <PopoverTrigger asChild>
                    <Info className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs bg-[#000000] text-white p-2 text-right border-none rounded-sm shadow-lg z-[100]" side="top">
                    <p className="text-xs leading-relaxed font-medium">{infoText}</p>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <Input
              type="text"
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-0 h-10 sm:h-11 rounded-xl border-gray-300 text-right text-sm sm:text-base px-2 sm:px-4"
              dir="rtl"
            />
          </div>

          <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <Button
                type="button"
                onClick={() => setCurrentType("required")}
                className={`px-3 sm:px-6 h-9 rounded-full text-xs sm:text-base font-normal transition-all border ${currentType === 'required'
                  ? 'bg-[#1a73e8] text-white border-[#1a73e8] hover:bg-[#1557b0]'
                  : 'bg-white text-[#5f6368] border-[#1a73e8] hover:bg-blue-50'
                  }`}
              >
                חובה
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentType("advantage")}
                className={`px-3 sm:px-6 h-9 rounded-full text-xs sm:text-base font-normal transition-all border ${currentType === 'advantage'
                  ? 'bg-[#1a73e8] text-white border-[#1a73e8] hover:bg-[#1557b0]'
                  : 'bg-white text-[#5f6368] border-[#1a73e8] hover:bg-blue-50'
                  }`}
              >
                יתרון
              </Button>
            </div>
            <Button
              type="button"
              onClick={handleAddItem}
              disabled={!inputValue.trim()}
              className={`px-4 sm:px-6 h-9 rounded-full text-xs sm:text-base font-normal transition-all duration-200 ${inputValue.trim()
                ? 'bg-[#34A853] hover:bg-[#2d9147] text-white shadow-sm'
                : 'bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed hover:bg-gray-200'
                }`}
            >
              שמירה
            </Button>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleAddItem}
        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
      >
        + הוספת {label}
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
