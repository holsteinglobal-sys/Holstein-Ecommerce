import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdCheckCircle, MdSecurity, MdReceipt, MdHourglassTop } from 'react-icons/md';

/**
 * PaymentStatusOverlay
 * A premium full-screen overlay to show payment processing stages.
 * 
 * @param {string} status - 'verifying', 'confirming', 'generating', 'success'
 */
const PaymentStatusOverlay = ({ status }) => {
  if (!status) return null;

  const stages = {
    verifying: {
      icon: <MdSecurity className="text-6xl text-blue-500" />,
      title: "Verifying Payment",
      description: "We are confirming your payment with Razorpay. Please do not close this window.",
      color: "bg-blue-500",
    },
    confirming: {
      icon: <MdHourglassTop className="text-6xl text-indigo-500 animate-spin-slow" />,
      title: "Securing Order",
      description: "Assigning your items and updating our records...",
      color: "bg-indigo-500",
    },
    generating: {
      icon: <MdReceipt className="text-6xl text-amber-500" />,
      title: "Generating Invoice",
      description: "Almost there! We are preparing your official receipt for download.",
      color: "bg-amber-500",
    },
    success: {
      icon: <MdCheckCircle className="text-7xl text-emerald-500" />,
      title: "Payment Successful",
      description: "Thank you! Redirecting you to your order details...",
      color: "bg-emerald-500",
    }
  };

  const currentStage = stages[status] || stages.verifying;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-md"
      >
        <div className="max-w-md w-full p-8 text-center">
          {/* Animated Icon Container */}
          <motion.div
            key={status}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="mb-8 flex justify-center"
          >
            <div className={`p-6 rounded-full bg-slate-50 shadow-xl shadow-slate-200/50 relative overflow-hidden`}>
               {/* Pulse effect for processing stages */}
               {status !== 'success' && (
                 <motion.div 
                   animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className={`absolute inset-0 ${currentStage.color} opacity-20`}
                 />
               )}
               <div className="relative z-10">
                 {currentStage.icon}
               </div>
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            key={`text-${status}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {currentStage.title}
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              {currentStage.description}
            </p>
          </motion.div>

          {/* Progress Bar (Visual Only) */}
          <div className="mt-12 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              layoutId="progress"
              className={`h-full ${status === 'success' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              initial={{ width: "0%" }}
              animate={{ 
                width: status === 'verifying' ? "25%" : 
                       status === 'confirming' ? "50%" : 
                       status === 'generating' ? "85%" : "100%" 
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          <p className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
            Step {status === 'verifying' ? '1' : status === 'confirming' ? '2' : status === 'generating' ? '3' : '4'} of 4
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentStatusOverlay;
