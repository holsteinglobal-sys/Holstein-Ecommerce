import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { MdDelete, MdFileDownload, MdVisibility, MdWork, MdLocationOn, MdEmail, MdPhone, MdContentCopy } from 'react-icons/md';
import { exportToExcel } from '../../utils/excelExport';
import toast from 'react-hot-toast';

const AdminCareers = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "careerApplications"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        formattedDate: doc.data().createdAt?.toDate().toLocaleString() || 'N/A'
      }));
      setApplications(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "careerApplications", id), { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      try {
        await deleteDoc(doc(db, "careerApplications", id));
        toast.success("Application deleted");
      } catch (error) {
        toast.error("Failed to delete application");
      }
    }
  };

  const handleExport = () => {
    const exportData = applications.map(({ id, fullName, email, phone, position, city, totalExperience, formattedDate, status }) => ({
      ID: id,
      Name: fullName,
      Email: email,
      Phone: phone,
      Position: position,
      City: city,
      Experience: totalExperience,
      Status: status,
      Date: formattedDate
    }));
    exportToExcel(exportData, "Career_Applications", "Applications");
  };

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-indigo-600"></span></div>;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Career Applications</h2>
          <p className="text-slate-500 font-medium mt-1">Review and manage job applicants ({applications.length})</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          <MdFileDownload className="text-xl" />
          Export to Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Applicant</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Position & Exp</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Resume</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-6 min-w-[250px]">
                  <div className="flex flex-col gap-1">
                    <div className="font-bold text-slate-900">{app.fullName}</div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MdEmail className="text-slate-400" /> {app.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MdPhone className="text-slate-400" /> {app.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 min-w-[200px]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-bold text-indigo-600 text-sm">
                      <MdWork /> {app.position}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MdLocationOn className="text-slate-400" /> {app.city}
                    </div>
                    <div className="text-xs font-medium text-slate-500">Exp: {app.totalExperience}</div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  {app.resumeUrl ? (
                    <div className="flex flex-col gap-2">
                      <a 
                        href={`https://docs.google.com/viewer?url=${encodeURIComponent(app.resumeUrl)}&embedded=false`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline text-sm"
                      >
                        <MdVisibility className="text-lg" />
                        View (External)
                      </a>
                      <a 
                        href={app.resumeUrl.replace('/upload/', '/upload/fl_attachment/')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:underline text-xs"
                      >
                        <MdFileDownload className="text-lg" />
                        Download
                      </a>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(app.resumeUrl);
                          toast.success("Link copied to clipboard");
                        }}
                        className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors text-xs"
                      >
                        <MdContentCopy className="text-lg" />
                        Copy Link
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm italic">No file uploaded</span>
                  )}
                </td>
                <td className="px-6 py-6">
                  <select 
                    value={app.status || 'pending'}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className={`text-xs font-bold px-3 py-2 rounded-xl border focus:outline-none transition-all ${
                      app.status === 'hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      app.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td className="px-6 py-6 text-right">
                  <button 
                    onClick={() => handleDelete(app.id)}
                    className="p-3 text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                  >
                    <MdDelete className="text-xl" />
                  </button>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center text-slate-400 font-medium text-lg">
                  No job applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCareers;
