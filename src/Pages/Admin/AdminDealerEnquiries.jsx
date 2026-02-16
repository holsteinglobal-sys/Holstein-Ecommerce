import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { MdDelete, MdFileDownload, MdBusiness, MdLocationOn, MdEmail, MdPhone, MdAssignment } from 'react-icons/md';
import { exportToExcel } from '../../utils/excelExport';
import toast from 'react-hot-toast';

const AdminDealerEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "businessEnquiries"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        formattedDate: doc.data().createdAt?.toDate().toLocaleString() || 'N/A'
      }));
      setEnquiries(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "businessEnquiries", id), { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this enquiry?")) {
      try {
        await deleteDoc(doc(db, "businessEnquiries", id));
        toast.success("Enquiry deleted");
      } catch (error) {
        toast.error("Failed to delete enquiry");
      }
    }
  };

  const handleExport = () => {
    const exportData = enquiries.map(({ id, fullName, companyName, email, phone, businessType, state, interestedProducts, status, formattedDate }) => ({
      ID: id,
      Name: fullName,
      Company: companyName,
      Email: email,
      Phone: phone,
      Type: businessType,
      State: state,
      Interested_In: interestedProducts,
      Status: status,
      Date: formattedDate
    }));
    exportToExcel(exportData, "Dealer_Enquiries", "Enquiries");
  };

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-indigo-600"></span></div>;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Dealer & Distributor enquiries</h2>
          <p className="text-slate-500 font-medium mt-1">Manage partnership requests and business leads ({enquiries.length})</p>
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
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Business Info</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Type & Interest</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Location</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {enquiries.map((eq) => (
              <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-6 min-w-[250px]">
                  <div className="flex flex-col gap-1">
                    <div className="font-bold text-slate-900">{eq.fullName}</div>
                    <div className="text-sm font-medium text-slate-600">({eq.companyName})</div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                      <MdEmail className="text-slate-400" /> {eq.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MdPhone className="text-slate-400" /> {eq.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 min-w-[200px]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-bold text-indigo-600 text-sm">
                      <MdBusiness className="text-indigo-400" /> {eq.businessType}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MdAssignment className="text-slate-400" /> {eq.interestedProducts}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 min-w-[150px]">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <MdLocationOn className="text-slate-400" /> {eq.state}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">{eq.formattedDate}</div>
                </td>
                <td className="px-6 py-6">
                  <select 
                    value={eq.status || 'pending'}
                    onChange={(e) => handleStatusChange(eq.id, e.target.value)}
                    className={`text-xs font-bold px-3 py-2 rounded-xl border focus:outline-none transition-all ${
                      eq.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      eq.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td className="px-6 py-6 text-right">
                  <button 
                    onClick={() => handleDelete(eq.id)}
                    className="p-3 text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                  >
                    <MdDelete className="text-xl" />
                  </button>
                </td>
              </tr>
            ))}
            {enquiries.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center text-slate-400 font-medium text-lg">
                  No business enquiries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDealerEnquiries;
