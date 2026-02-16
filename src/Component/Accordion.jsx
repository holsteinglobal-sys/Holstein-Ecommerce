import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdRemove } from 'react-icons/md';

export const AccordionItem = ({ title, children, isOpen, onClick, index, activeColor = 'bg-primary' }) => {
  const isEmerald = activeColor.includes('emerald');
  const textColor = isEmerald ? 'text-emerald-600' : 'text-primary';
  const shadowColor = isEmerald ? 'shadow-emerald-500/30' : 'shadow-primary/30';
  const lightBg = isEmerald ? 'bg-emerald-50' : 'bg-primary/5';
  const hoverBg = isEmerald ? 'group-hover:bg-emerald-50' : 'group-hover:bg-primary/10';
  const hoverText = isEmerald ? 'group-hover:text-emerald-600' : 'group-hover:text-primary';

  return (
    <div className={`group border  border-gray-100 rounded-[2rem] bg-white transition-all duration-500 overflow-hidden ${
      isOpen ? `shadow-2xl ${isEmerald ? 'shadow-emerald-500/10' : 'shadow-primary/5'} ${isEmerald ? 'border-emerald-500/20' : 'border-primary/20'}` : 'hover:shadow-xl hover:shadow-gray-200/40'
    }`}>
      <button
        onClick={onClick}
        className="w-full px-8 py-6 flex items-center justify-between text-left gap-4"
      >
        <div className="flex items-center gap-4">
          <span className={`flex-shrink-0 w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center font-black transition-colors duration-500 ${
            isOpen ? `${activeColor} text-white shadow-lg ${shadowColor}` : `${lightBg} ${textColor}`
          }`}>
            {index !== undefined ? `0${index + 1}` : '•'}
          </span>
          <h3 className={`text-lg font-bold transition-colors duration-500 font-bold ${
            isOpen ? 'text-gray-900' : 'text-gray-700'
          }`}>
            {title}
          </h3>
        </div>
        
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
          isOpen ? `${activeColor} text-white rotate-180` : `bg-gray-50 text-gray-400 ${hoverBg} ${hoverText}`
        }`}>
          {isOpen ? <MdRemove size={24} /> : <MdAdd size={24} />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-8 pb-8 pt-2">
              <div className="border-t border-gray-50 pt-6 text-gray-500 leading-relaxed text-sm font-medium">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Accordion = ({ items, className = "", activeColor = 'bg-primary' }) => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          index={index}
          title={item.title}
          activeColor={activeColor}
          isOpen={openIndex === index}
          onClick={() => setOpenIndex(prev => prev === index ? -1 : index)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

export default Accordion;

