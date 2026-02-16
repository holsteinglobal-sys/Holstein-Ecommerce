import { db } from "../../lib/firebase";
import { useState } from "react";
import toast from 'react-hot-toast';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { uploadToCloudinary } from "../../utils/cloudinary";

const initialFormState = {
  fullName: "",
  email: "",
  phone: "",
  position: "",
  city: "",
  totalExperience: "",
  relevantExperience: "",
};

const Career = () => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState(initialFormState);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resume) {
      toast.error("Please upload your resume");
      return;
    }

    try {
      setLoading(true);

      // 1. Upload Resume to Cloudinary
      toast.loading("Uploading resume...", { id: "upload-status" });
      const resumeUrl = await uploadToCloudinary(resume);
      toast.success("Resume uploaded successfully!", { id: "upload-status" });

      // 2. Save to Firestore
      await addDoc(collection(db, "careerApplications"), {
        ...form,
        uid: currentUser?.uid || null,
        resumeUrl: resumeUrl,
        resumeName: resume.name,
        createdAt: serverTimestamp(),
        status: "pending"
      });

      toast.success("Application submitted successfully");
      setForm(initialFormState);
      setResume(null);
      // Reset file input manually if needed (optional)
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong", { id: "upload-status" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden mt-15">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-bl from-indigo-100 to-transparent -z-10 opacity-50"></div>
      <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-emerald-50 rounded-full blur-3xl -z-10 opacity-30"></div>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16 animate-fadeInDown">
          <span className="text-emerald-600 font-bold uppercase tracking-widest text-sm bg-emerald-50 px-4 py-2 rounded-full mb-4 inline-block">
            Join Our Team
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mt-4 mb-6 tracking-tight leading-tight">
            Build Your Future <br /> with <span className="text-indigo-600">Holstein</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We're searching for passionate individuals who want to redefine nutrition and build a sustainable future. Explore opportunities to grow with us.
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl p-8 md:p-14 animate-fadeInUp">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            Application Form
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Rahul Sharma"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="rahul@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 00000 00000"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Preferred Position</label>
                <input
                  type="text"
                  name="position"
                  placeholder="e.g. Area Manager"
                  value={form.position}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Current City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="e.g. Ludhiana"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Total Experience</label>
                <select
                  name="totalExperience"
                  value={form.totalExperience}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-800"
                  required
                >
                  <option value="">Select Experience</option>
                  <option>Fresher</option>
                  <option>1 - 3 Years</option>
                  <option>3 - 5 Years</option>
                  <option>5+ Years</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Relevant Experience Summary</label>
              <textarea
                name="relevantExperience"
                placeholder="Briefly describe your relevant professional background..."
                value={form.relevantExperience}
                onChange={handleChange}
                rows="4"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-800 resize-none"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 ml-1 block">Resume / Curriculum Vitae (PDF Preferred)</label>
              <div className={`relative group border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-3 ${resume ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30'}`}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResume(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  required
                />
                
                {resume ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-emerald-900">{resume.name}</p>
                      <p className="text-sm text-emerald-600">File attached successfully</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">Click or drag to upload</p>
                      <p className="text-sm text-gray-500">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-bold text-xl hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-200 active:scale-95 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {loading ? (
                <><span className="loading loading-spinner loading-md"></span> Applying...</>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Career;
