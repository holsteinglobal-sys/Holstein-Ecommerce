import React, { useState, useEffect } from 'react';
import { MdAccountBalanceWallet, MdHistory, MdTrendingUp, MdTrendingDown } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';

const Wallet = () => {
    const { currentUser } = useAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        // 1. Listen to user balance
        const userRef = doc(db, "users", currentUser.uid);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setBalance(docSnap.data().walletBalance || 0);
            }
            setLoading(false);
        });

        // 2. Query transactions
        const q = query(
            collection(db, "wallet_transactions"),
            where("userId", "==", currentUser.uid),
            orderBy("date", "desc")
        );
        const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
            setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeUser();
            unsubscribeTransactions();
        };
    }, [currentUser]);

    return (
        <div className="space-y-6 m-3 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <MdAccountBalanceWallet className="text-primary" /> My Wallet
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Balance Card */}
                <div className="card bg-gradient-to-r from-primary to-indigo-600 text-white shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16"></div>
                    <div className="card-body relative z-10">
                        <h2 className="card-title text-white/80 text-sm uppercase tracking-wider">Available Balance</h2>
                        <div className="text-5xl font-extrabold mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-medium">₹</span>
                            {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="card-actions justify-end mt-4">
                            <button className="btn btn-sm bg-white/20 border-white/30 text-white hover:bg-white hover:text-primary backdrop-blur-sm">
                                + Add Money
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Promo Card */}
                <div className="card bg-white shadow-sm border border-gray-100 overflow-hidden">
                    <div className="card-body flex-row items-center gap-6">
                         <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl">🎁</div>
                         <div>
                            <h3 className="font-bold text-lg text-gray-800">Refer & Earn</h3>
                            <p className="text-sm text-gray-500">Invite friends and earn ₹50 per referral.</p>
                            <button className="btn btn-link btn-sm p-0 h-auto min-h-0 mt-2 text-primary font-bold">View Details</button>
                         </div>
                    </div>
                </div>
            </div>

            {/* Transactions Section */}
            <div className="card bg-white shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                        <MdHistory className="text-lg" /> Transaction History
                    </h3>
                    <span className="text-xs font-medium text-gray-400">{transactions.length} Total</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <tbody className="divide-y divide-gray-50">
                            {transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {tx.type === 'credit' ? <MdTrendingUp /> : <MdTrendingDown />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">{tx.description}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">
                                                    {tx.date?.toDate ? tx.date.toDate().toLocaleString() : 'Processing...'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                                        </div>
                                        <div className="text-[10px] text-gray-400">ID: {tx.id.slice(0, 8)}...</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {(transactions.length === 0 && !loading) && (
                        <div className="py-16 text-center">
                            <div className="text-4xl mb-2 opacity-20">📭</div>
                            <div className="text-gray-400 text-sm">No transactions yet.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Wallet;
