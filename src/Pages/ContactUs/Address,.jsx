import React from "react";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from "react-icons/fa";

const Address = () => {
  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl p-8 space-y-8 shadow-2xl shadow-indigo-100/50">
      <h3 className="text-2xl font-bold text-indigo-900 border-b border-indigo-100 pb-4">Our Presence</h3>
      
      <div className="flex items-start gap-5 group">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
          <FaMapMarkerAlt className="text-xl" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-lg">Address</h4>
          <p className="text-gray-600 mt-1 leading-relaxed">
            Holstein Nutrition Pvt. Ltd.<br />
            1803, 18th Floor, Omaxe India Trade Tower,
            New Chandigarh, Punjab
          </p>
        </div>
      </div>

      <div className="flex items-start gap-5 group">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
          <FaPhoneAlt className="text-xl" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-lg">Connect with Us</h4>
          <p className="text-gray-600 mt-1">1800-123-4567 (Toll-Free)</p>
        
        </div>
      </div>

      <div className="flex items-start gap-5 group">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
          <FaEnvelope className="text-xl" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-lg">Support Mail</h4>
          <p className="text-gray-600 mt-1">support@holstein.in</p>
         
        </div>
      </div>

    </div>
  );
};

export default Address;
