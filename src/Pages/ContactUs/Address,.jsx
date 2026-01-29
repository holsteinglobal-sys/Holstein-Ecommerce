import React from "react";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from "react-icons/fa";

const Address = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
      
      <div className="flex items-start gap-4">
        <FaMapMarkerAlt className="text-indigo-600 text-xl mt-1" />
        <div>
          <h4 className="font-semibold text-gray-800">Address</h4>
          <p className="text-gray-500 text-sm">
            Holstein Nutrition Pvt. Ltd.<br />
            1803, 18th Floor, Omaxe India Trade Tower,
            New Chandigarh 
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <FaPhoneAlt className="text-indigo-600 text-xl mt-1" />
        <div>
          <h4 className="font-semibold text-gray-800">Toll-Free</h4>
          <p className="text-gray-500 text-sm">1800-123-4567</p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <FaEnvelope className="text-indigo-600 text-xl mt-1" />
        <div>
          <h4 className="font-semibold text-gray-800">Email</h4>
          <p className="text-gray-500 text-sm">support@holstein.in</p>
        </div>
      </div>

    </div>
  );
};

export default Address;
