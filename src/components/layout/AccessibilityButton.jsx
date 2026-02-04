import React, { useState, useEffect } from "react";
import {
    Accessibility,
    Type,
    Eye,
    Link,
    Moon,
    RefreshCcw,
    MousePointer2,
    ALargeSmall,
    Heading,
    Ban,
    Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export default function AccessibilityButton() {
    const [isOpen, setIsOpen] = useState(false);

    // Accessibility States
    const [fontSize, setFontSize] = useState(100);
    const [readableFont, setReadableFont] = useState(false);
    const [highlightLinks, setHighlightLinks] = useState(false);
    const [highlightHeadings, setHighlightHeadings] = useState(false);
    const [contrastMode, setContrastMode] = useState('normal'); // normal, dark, light, invert
    const [grayscale, setGrayscale] = useState(false);
    const [bigCursor, setBigCursor] = useState(false);
    const [stopAnimations, setStopAnimations] = useState(false);

    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        // Reset
        root.style.fontSize = '';
        body.style.filter = '';
        body.classList.remove(
            'access-readable-font',
            'access-highlight-links',
            'access-highlight-headings',
            'access-big-cursor',
            'access-stop-animations',
            'access-contrast-dark',
            'access-contrast-light',
            'access-contrast-invert'
        );

        // Apply Font Size
        if (fontSize !== 100) {
            root.style.fontSize = `${fontSize}%`;
        }

        // Apply Readable Font
        if (readableFont) body.classList.add('access-readable-font');

        // Apply Highlights
        if (highlightLinks) body.classList.add('access-highlight-links');
        if (highlightHeadings) body.classList.add('access-highlight-headings');

        // Apply Cursor
        if (bigCursor) body.classList.add('access-big-cursor');

        // Apply Stop Animations
        if (stopAnimations) body.classList.add('access-stop-animations');

        // Apply Contrast & Grayscale
        const filters = [];
        if (grayscale) filters.push('grayscale(100%)');

        switch (contrastMode) {
            case 'dark':
                body.classList.add('access-contrast-dark');
                break;
            case 'light':
                body.classList.add('access-contrast-light');
                filters.push('contrast(125%)');
                break;
            case 'invert':
                filters.push('invert(100%)');
                break;
        }

        if (filters.length > 0) {
            body.style.filter = filters.join(' ');
        }

    }, [fontSize, readableFont, highlightLinks, highlightHeadings, contrastMode, grayscale, bigCursor, stopAnimations]);

    // Inject Global Styles
    useEffect(() => {
        const styleId = "accessibility-custom-styles";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
                /* Readable Font */
                .access-readable-font * {
                    font-family: Arial, Helvetica, sans-serif !important;
                }

                /* Highlight Links */
                .access-highlight-links a {
                    text-decoration: underline !important;
                    background-color: yellow !important;
                    color: black !important;
                    font-weight: bold !important;
                }

                /* Highlight Headings */
                .access-highlight-headings h1, 
                .access-highlight-headings h2, 
                .access-highlight-headings h3, 
                .access-highlight-headings h4, 
                .access-highlight-headings h5, 
                .access-highlight-headings h6 {
                    background-color: #d1e7dd !important;
                    color: #0f5132 !important;
                    outline: 2px solid #0f5132 !important;
                    padding: 2px !important;
                }

                /* Big Cursor */
                .access-big-cursor, .access-big-cursor * {
                    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewport="0 0 48 48" style="fill:black;stroke:white;stroke-width:2px;"><path d="M1 1l16 40 6.6-14.6 14.6-6.6z"/></svg>'), auto !important;
                }

                /* Stop Animations */
                .access-stop-animations *, 
                .access-stop-animations *:before, 
                .access-stop-animations *:after {
                    animation-duration: 0.001s !important;
                    transition-duration: 0.001s !important;
                }

                /* Contrast Themes */
                .access-contrast-dark {
                    background-color: #121212 !important;
                    color: #ffffff !important;
                }
                .access-contrast-dark * {
                    background-color: #121212 !important;
                    color: #ffffff !important;
                    border-color: #ffffff !important;
                }
                
                .access-contrast-light {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                }
                .access-contrast-light * {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    const resetSettings = () => {
        setFontSize(100);
        setReadableFont(false);
        setHighlightLinks(false);
        setHighlightHeadings(false);
        setContrastMode('normal');
        setGrayscale(false);
        setBigCursor(false);
        setStopAnimations(false);
    };

    const features = [
        {
            icon: ALargeSmall,
            label: "גודל טקסט",
            active: fontSize > 100,
            onClick: () => setFontSize(prev => prev >= 150 ? 100 : prev + 10),
            value: fontSize > 100 ? `${fontSize}%` : null
        },
        {
            icon: Type,
            label: "גופן קריא",
            active: readableFont,
            onClick: () => setReadableFont(!readableFont)
        },
        {
            icon: Link,
            label: "הדגשת קישורים",
            active: highlightLinks,
            onClick: () => setHighlightLinks(!highlightLinks)
        },
        {
            icon: Heading,
            label: "הדגשת כותרות",
            active: highlightHeadings,
            onClick: () => setHighlightHeadings(!highlightHeadings)
        },
        {
            icon: Moon,
            label: "ניגודיות",
            active: contrastMode !== 'normal',
            onClick: () => {
                const modes = ['normal', 'dark', 'light', 'invert'];
                const nextIndex = (modes.indexOf(contrastMode) + 1) % modes.length;
                setContrastMode(modes[nextIndex]);
            },
            value: contrastMode !== 'normal' ? (contrastMode === 'dark' ? 'כהה' : contrastMode === 'light' ? 'בהיר' : 'היפוך') : null
        },
        {
            icon: Eye,
            label: "גווני אפור",
            active: grayscale,
            onClick: () => setGrayscale(!grayscale)
        },
        {
            icon: MousePointer2,
            label: "סמן גדול",
            active: bigCursor,
            onClick: () => setBigCursor(!bigCursor)
        },
        {
            icon: Ban,
            label: "עצור אנימציות",
            active: stopAnimations,
            onClick: () => setStopAnimations(!stopAnimations)
        },
    ];

    return (
        <div className="fixed bottom-5 left-5 z-[100]">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-2xl border-4 border-white transition-transform hover:scale-110"
                        aria-label="תפריט נגישות"
                    >
                        <Accessibility className="h-8 w-8 text-white" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[340px] p-0 bg-white/95 backdrop-blur-md shadow-2xl border-0 overflow-hidden rounded-xl"
                    side="top"
                    align="start"
                    sideOffset={20}
                >
                    <div className="flex flex-col h-full" dir="rtl">
                        {/* Header */}
                        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Accessibility className="h-5 w-5" />
                                <h3 className="font-bold text-lg">כלי נגישות</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetSettings}
                                className="h-8 px-2 text-white/80 hover:text-white hover:bg-white/20"
                            >
                                <RefreshCcw className="h-4 w-4 ml-1" />
                                איפוס
                            </Button>
                        </div>

                        {/* Grid of Options */}
                        <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50/50">
                            {features.map((feature, index) => (
                                <button
                                    key={index}
                                    onClick={feature.onClick}
                                    className={`
                                        flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 gap-2 h-24
                                        ${feature.active
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'}
                                    `}
                                >
                                    <feature.icon className={`h-6 w-6 ${feature.active ? 'text-white' : 'text-blue-600'}`} />
                                    <span className="text-xs font-medium text-center leading-tight">
                                        {feature.label}
                                    </span>
                                    {feature.value && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${feature.active ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                                            {feature.value}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-100 p-3 text-center border-t flex flex-col gap-2 items-center">
                            <a
                                href="https://metch.co.il/accessibility-statement/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1"
                            >
                                הצהרת נגישות
                            </a>
                            <span className="text-[10px] text-gray-500">
                                מונגש באמצעות רכיב נגישות מתקדם
                            </span>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
