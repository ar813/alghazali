import React from 'react';
import { motion } from 'framer-motion';

const PremiumLoader = ({ text = "Loading..." }: { text?: string }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-8">
            <div className="relative">
                {/* Outer Ring */}
                <motion.div
                    className="w-24 h-24 rounded-full border-4 border-gray-100"
                    style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />

                {/* Middle Ring */}
                <motion.div
                    className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-indigo-100"
                    style={{ borderTopColor: '#6366f1', borderLeftColor: 'transparent' }} // Indigo-500
                    animate={{ rotate: -360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner Ring */}
                <motion.div
                    className="absolute top-4 left-4 w-16 h-16 rounded-full border-4 border-purple-100"
                    style={{ borderTopColor: '#a855f7', borderBottomColor: 'transparent' }} // Purple-500
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Center Dot */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-3 h-3 bg-indigo-600 rounded-full"
                    style={{ x: '-50%', y: '-50%' }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                />
            </div>

            <div className="text-center space-y-2">
                <motion.h3
                    className="text-lg font-semibold text-gray-700 tracking-tight"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {text}
                </motion.h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Please Wait</p>
            </div>
        </div>
    );
};

export default PremiumLoader;
