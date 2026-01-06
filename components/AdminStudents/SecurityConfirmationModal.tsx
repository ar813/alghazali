import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SecurityConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: React.ReactNode;
    verificationText: string;
    loading?: boolean;
    variant?: 'danger' | 'warning';
}

const SecurityConfirmationModal: React.FC<SecurityConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    verificationText,
    loading = false,
    variant = 'danger'
}) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setInputValue('');
            setError(false);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (inputValue !== verificationText) {
            setError(true);
            return;
        }
        onConfirm();
    };

    if (!isOpen) return null;

    const baseColor = variant === 'danger' ? 'red' : 'amber';
    const activeColor = variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
                >
                    {/* Header */}
                    <div className={`px-6 py-4 border-b border-gray-100 bg-${baseColor}-50/50 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full bg-${baseColor}-100 text-${baseColor}-600`}>
                                <AlertTriangle size={20} className={variant === 'danger' ? "stroke-red-600" : "stroke-amber-600"} />
                            </div>
                            <h3 className={`text-lg font-bold text-gray-900`}>{title}</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="text-gray-600 text-sm mb-6 leading-relaxed">
                            {description}
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">
                                To confirm, type <span className="font-bold select-all bg-gray-100 px-1 rounded border border-gray-200">{verificationText}</span> below:
                            </label>

                            <div>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        setError(false);
                                    }}
                                    onPaste={(e) => e.preventDefault()} // Force typing for security
                                    placeholder={verificationText}
                                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${error
                                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                        : 'border-gray-200 focus:border-gray-900 focus:ring-4 focus:ring-gray-100'
                                        }`}
                                />
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-red-500 text-xs mt-2 font-medium ml-1"
                                    >
                                        Verification text does not match. Please type exactly as shown.
                                    </motion.p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading || inputValue !== verificationText}
                            className={`px-5 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 ${activeColor}`}
                        >
                            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {loading ? 'Processing...' : 'Confirm Action'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SecurityConfirmationModal;
