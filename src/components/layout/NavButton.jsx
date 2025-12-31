import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export const NavButton = ({ to, icon: Icon, text, isActive }) => {
    const [isHovered, setIsHovered] = useState(false);
    const showText = isActive || isHovered;

    return (
        <Button
            asChild
            variant="ghost"
            className={`hover:bg-transparent bg-transparent rounded-full px-3 py-3 text-base transition-all duration-200`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link to={to} className="flex items-center gap-2">
                <Icon className={`w-7 h-7 text-gray-700`} strokeWidth={1.5} />

                <motion.div
                    initial={false}
                    animate={{
                        width: showText ? "auto" : 0,
                        opacity: showText ? 1 : 0,
                        marginLeft: showText ? 8 : 0 // Add gap margin only when visible
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="overflow-hidden whitespace-nowrap"
                >
                    <span className="font-normal text-gray-700">
                        {text}
                    </span>
                </motion.div>
            </Link>
        </Button>
    );
};
