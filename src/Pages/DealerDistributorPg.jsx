import {db} from '../lib/firebase';
import { useState } from "react";
import toast from 'react-hot-toast';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const DealerDistributorPg = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    businessType: "",
    yearsInBusiness: "",
    monthlySales: "",
    interestedProducts: "",
    hearAboutUs: "",
    additionalDetails: "",
    confirm: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("Please login first to submit the inquiry.");
      return;
    }

    if (!form.confirm) {
      toast.error("Please confirm the details are correct.");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "businessEnquiries"), {
        ...form,
        uid: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        status: "pending"
      });

      toast.success("Partnership enquiry submitted successfully!");
      setForm({
        fullName: "",
        companyName: "",
        email: "",
        phone: "",
        address: "",
        state: "",
        businessType: "",
        yearsInBusiness: "",
        monthlySales: "",
        interestedProducts: "",
        hearAboutUs: "",
        additionalDetails: "",
        confirm: false,
      });
    } catch (err) {
      console.error(err);
      toast.error("Form submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden mt-15">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-full h-[50vh] bg-gradient-to-br from-blue-100 to-transparent -z-10 opacity-60"></div>
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-indigo-50 rounded-full blur-[120px] -z-10 opacity-30"></div>

      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16 animate-fadeInDown">
          <span className="text-blue-600 font-bold uppercase tracking-[0.2em] text-xs bg-blue-50 px-5 py-2.5 rounded-full mb-6 inline-block">
            Global Partnership
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mt-2 mb-8 tracking-tight">
            Become a <span className="text-blue-600 italic">Partner</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Join the most trusted name in cattle nutrition. Expand your business horizons with Holstein's premium distribution network.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-8 md:p-16 animate-fadeInUp">
          <div className="mb-12 border-b border-slate-100 pb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Business Inquiry Form</h2>
            <p className="text-gray-500 font-medium">Complete the details below and our partnership manager will contact you.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Section: Personal Info */}
            <div className="space-y-6">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase ml-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    placeholder="Enter your name"
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-semibold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase ml-1">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={form.companyName}
                    placeholder="Enter business name"
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-semibold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase ml-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    placeholder="example@business.com"
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-semibold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase ml-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    placeholder="+91 00000 00000"
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-semibold"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section: Business Details */}
            <div className="space-y-6 pt-6">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest">Business Details</h3>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase ml-1">Business Address</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    placeholder="Street, City, Area"
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase ml-1">State / Region</label>
                    <input
                      type="text"
                      name="state"
                      value={form.state}
                      placeholder="e.g. Punjab"
                      onChange={handleChange}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase ml-1">Business Type</label>
                    <select
                      name="businessType"
                      value={form.businessType}
                      onChange={handleChange}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-semibold appearance-none"
                      required
                    >
                      <option value="">Select Type</option>
                      <option>Dairy Farm</option>
                      <option>Cattle Feed Shop</option>
                      <option>Distributor</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase ml-1">Years in Business</label>
                    <select
                      name="yearsInBusiness"
                      value={form.yearsInBusiness}
                      onChange={handleChange}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-semibold"
                      required
                    >
                      <option value="">Select Tenure</option>
                      <option>Less than 1 year</option>
                      <option>1 - 3 years</option>
                      <option>3 - 5 years</option>
                      <option>5+ years</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase ml-1">Monthly Sales Volume</label>
                    <select
                      name="monthlySales"
                      value={form.monthlySales}
                      onChange={handleChange}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-semibold"
                      required
                    >
                      <option value="">Select Volume</option>
                      <option>Less than ₹50,000</option>
                      <option>₹50,000 - ₹1,00,000</option>
                      <option>₹1,00,000 - ₹5,00,000</option>
                      <option>₹5,00,000 +</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase ml-1">Interested Products</label>
                    <select
                      name="interestedProducts"
                      value={form.interestedProducts}
                      onChange={handleChange}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-semibold"
                      required
                    >
                      <option value="">Select Product Line</option>
                      <option>Calf Starter / Growth Booster</option>
                      <option>Prime Care / Dry Care</option>
                      <option>Transition Wellness</option>
                      <option>Xtra Milk Series</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-3 pt-4">
              <label className="text-xs font-black text-gray-500 uppercase ml-1">Additional Details</label>
              <textarea
                name="additionalDetails"
                value={form.additionalDetails}
                placeholder="Tell us more about your business vision..."
                onChange={handleChange}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-medium resize-none"
                rows="4"
              />
            </div>

            {/* Confirmation & Submit */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-6">
              <div className="flex items-center gap-4 group cursor-pointer">
                <input
                  type="checkbox"
                  name="confirm"
                  checked={form.confirm}
                  onChange={handleChange}
                  className="w-6 h-6 border-2 border-slate-200 rounded-lg text-blue-600 focus:ring-blue-500 cursor-pointer"
                  id="confirm-btn"
                  required
                />
                <label htmlFor="confirm-btn" className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors cursor-pointer">
                  I confirm that all provided information is accurate.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-12 py-5 rounded-2xl bg-blue-600 text-white font-black text-lg hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 active:scale-95 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-4"
              >
                {loading ? (
                  <><span className="loading loading-spinner loading-md"></span> Processing...</>
                ) : (
                  "Submit Partnership Enquiry"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DealerDistributorPg;
