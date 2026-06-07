import React, { useEffect } from "react";
import { Slicon } from "./Slicon";
import { motion, AnimatePresence } from "motion/react";

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const ModalBase: React.FC<ModalBaseProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
        {/* Frosted Blur Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Content Sheet */}
        <motion.div
          initial={{ y: "100%", opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0.8 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative w-full max-h-[90vh] md:max-h-[85vh] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col pointer-events-auto z-10 md:max-w-[560px]"
        >
          {/* Mobile Drag-Handle Pill */}
          <div className="flex md:hidden justify-center py-2.5">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#52B788] transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Slicon name="x" size={20} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-grow overflow-y-auto px-6 py-5 scrollbar-thin">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
