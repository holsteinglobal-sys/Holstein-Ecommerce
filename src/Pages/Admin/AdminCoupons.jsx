import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  doc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { MdAdd, MdHistory, MdBlock, MdCheckCircle, MdConfirmationNumber } from 'react-icons/md';
import toast from 'react-hot-toast';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [history, setHistory] = useState([]);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    value: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('manage'); // 'manage' or 'history'

  useEffect(() => {
    // Fetch Coupons
    const qCoupons = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
    const unsubscribeCoupons = onSnapshot(qCoupons, (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch History
    const qHistory = query(collection(db, 'redemptions'), orderBy('date', 'desc'));
    const unsubscribeHistory = onSnapshot(qHistory, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeCoupons();
      unsubscribeHistory();
    };
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'coupons'), {
        ...newCoupon,
        code: newCoupon.code.toUpperCase().trim(),
        value: Number(newCoupon.value),
        redemptionCount: 0,
        createdAt: serverTimestamp()
      });
      toast.success("Coupon created successfully!");
      setNewCoupon({ code: '', value: '', isActive: true });
    } catch (error) {
      console.error(error);
      toast.error("Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  const toggleCouponStatus = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'coupons', id), {
        isActive: !currentStatus
      });
      toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update coupon status");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Coupon Management</h2>
          <p className="text-gray-500 text-sm">Create and track coupon redemptions</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveView('manage')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeView === 'manage' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Manage Coupons
          </button>
          <button 
            onClick={() => setActiveView('history')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeView === 'history' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Redemption History
          </button>
        </div>
      </div>

      {activeView === 'manage' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Create Coupon Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MdAdd className="text-emerald-500" /> Create New Coupon
            </h3>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Coupon Code</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="E.g. WELCOME100"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Rupee Value (₹)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="E.g. 100"
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon({...newCoupon, value: e.target.value})}
                  required
                />
              </div>
              <div className="py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-sm checkbox-emerald"
                    checked={newCoupon.isActive}
                    onChange={(e) => setNewCoupon({...newCoupon, isActive: e.target.checked})}
                  />
                  <span className="text-sm text-gray-600">Active</span>
                </label>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Generate Coupon'}
              </button>
            </form>
          </div>

          {/* Coupons List */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Existing Coupons</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Code</th>
                    <th className="px-6 py-4 font-semibold">Value</th>
                    <th className="px-6 py-4 font-semibold">Used</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {coupons.map(coupon => (
                    <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                          <MdConfirmationNumber className="text-emerald-500" />
                          {coupon.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">₹{coupon.value}</td>
                      <td className="px-6 py-4 text-gray-500">{coupon.redemptionCount || 0}</td>
                      <td className="px-6 py-4">
                        {(coupon.redemptionCount || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600">
                            <MdBlock /> REDEEMED
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${coupon.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {coupon.isActive ? <MdCheckCircle /> : <MdBlock />}
                            {coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleCouponStatus(coupon.id, coupon.isActive)}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${coupon.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        >
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-400">No coupons found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Redemption History View */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="text-lg font-bold text-gray-800">Redemption History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">User Details</th>
                  <th className="px-6 py-4 font-semibold">Coupon ID/Code</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{item.userName}</div>
                      <div className="text-xs text-gray-500">{item.userEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="bg-gray-100 px-2 py-1 rounded text-red-500 font-bold">{item.couponCode || 'N/A'}</code>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">₹{item.amount}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {item.date?.toDate ? item.date.toDate().toLocaleString() : 'Recent'}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">No redemptions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
