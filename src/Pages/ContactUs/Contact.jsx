import { useState } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import Address from "./Address,";

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

const Contact = () => {
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await addDoc(collection(db, "contactMessages"), {
        ...form,
        createdAt: serverTimestamp(),
      });

      toast.success("Thank You for Contacting Us!");
      setForm(initialFormState);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden mt-15">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-indigo-100 to-transparent -z-10 opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl -z-10 opacity-30"></div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16 animate-fadeInDown">
          <span className="text-indigo-600 font-bold uppercase tracking-widest text-sm bg-indigo-50 px-4 py-2 rounded-full mb-4 inline-block">
            Get in Touch
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mt-4 mb-6 tracking-tight">
            We're Here to <span className="text-indigo-600">Help</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Have questions about our products or partnership opportunities? Reach out to us and our team will get back to you within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] shadow-2xl p-10 md:p-12 animate-fadeInLeft">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <span className="w-2 h-10 bg-indigo-600 rounded-full"></span>
              Send a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Your Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  rows="5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-800 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 active:scale-95 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <><span className="loading loading-spinner loading-sm"></span> Sending...</>
                ) : (
                  "Initiate Contact"
                )}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-5 animate-fadeInRight">
            <Address />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
