import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { MdDelete, MdFileDownload, MdEmail, MdPhone, MdPerson } from 'react-icons/md';
import { exportToExcel } from '../../utils/excelExport';
import toast from 'react-hot-toast';

const AdminContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "contactMessages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        formattedDate: doc.data().createdAt?.toDate().toLocaleString() || 'N/A'
      }));
      setMessages(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteDoc(doc(db, "contactMessages", id));
        toast.success("Message deleted");
      } catch (error) {
        toast.error("Failed to delete message");
      }
    }
  };

  const handleExport = () => {
    const exportData = messages.map(({ id, name, email, phone, message, formattedDate }) => ({
      ID: id,
      Name: name,
      Email: email,
      Phone: phone,
      Message: message,
      Date: formattedDate
    }));
    exportToExcel(exportData, "Contact_Messages", "Messages");
  };

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-indigo-600"></span></div>;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Contact Messages</h2>
          <p className="text-slate-500 font-medium mt-1">Manage and respond to user inquiries ({messages.length})</p>
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
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Sender Information</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Message Content</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {messages.map((msg) => (
              <tr key={msg.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-6 min-w-[300px]">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <MdPerson className="text-indigo-500" /> {msg.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MdEmail className="text-slate-400" /> {msg.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MdPhone className="text-slate-400" /> {msg.phone}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-full w-fit">
                      {msg.formattedDate}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-6 min-w-[400px]">
                  <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                    <p className="text-slate-700 text-sm leading-relaxed italic">"{msg.message}"</p>
                  </div>
                </td>
                <td className="px-6 py-6 text-right">
                  <button 
                    onClick={() => handleDelete(msg.id)}
                    className="p-3 text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                    title="Delete Message"
                  >
                    <MdDelete className="text-xl" />
                  </button>
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-20 text-center text-slate-400 font-medium text-lg">
                  No contact messages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminContactMessages;
