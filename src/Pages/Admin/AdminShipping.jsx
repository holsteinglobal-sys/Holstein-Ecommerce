import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { MdDelete, MdLocalShipping, MdAddLocationAlt } from 'react-icons/md';
import TableSkeleton from '../../Component/Skeletons/TableSkeleton';
import { AccordionItem } from '../../Component/Accordion';

const AdminShipping = () => {
    const [rules, setRules] = useState([]);
    const [newState, setNewState] = useState('');
    const [newPincodes, setNewPincodes] = useState('');
    const [newCharge, setNewCharge] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [openPinsId, setOpenPinsId] = useState(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "shipping_rules"), (snapshot) => {
            setRules(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
            setPageLoading(false);
        });
        return unsubscribe;
    }, []);

    const handleAddRule = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const pinArray = newPincodes.split(/[\s,]+/).map(p => p.trim()).filter(p => p.length > 0);
            
            await addDoc(collection(db, "shipping_rules"), {
                state: newState,
                pinCodes: pinArray,
                shippingCharge: Number(newCharge),
                isActive: isActive
            });
            
            setNewState('');
            setNewPincodes('');
            setNewCharge('');
            setIsActive(true);
            toast.success("Serviceable Area Added");
        } catch (error) {
            console.error(error);
            toast.error("Failed to add rule");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if(confirm("Are you sure you want to delete this rule?")) {
            await deleteDoc(doc(db, "shipping_rules", id));
            toast.success("Rule Deleted");
        }
    };

    const toggleStatus = async (rule) => {
        await updateDoc(doc(db, "shipping_rules", rule.id), {
            isActive: !rule.isActive
        });
    };

    if (pageLoading) {
        return <TableSkeleton rows={6} columns={4} />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <MdLocalShipping className="text-3xl text-primary" />
                <h2 className="text-3xl font-bold text-gray-800">Shipping & Logistics</h2>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
                {/* LEFT: Add New Rule Form */}
                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow-xl border border-gray-100 sticky top-8">
                        <div className="card-body">
                            <h3 className="card-title text-primary flex items-center gap-2">
                                <MdAddLocationAlt /> Add New Area
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">Define shipping charges for specific regions.</p>
                            
                            <form onSubmit={handleAddRule} className="space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Region / State Name</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Maharashtra" 
                                        className="input mt-2 w-full rounded-full bg-indigo-50 border-none
             focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                     transition-all duration-200"
                                        value={newState}
                                        onChange={(e) => setNewState(e.target.value)}
                                        required 
                                    />
                                </div>
                                
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Shipping Charge (₹)</span>
                                    </label>
                                    <input 
                                        type="number" 
                                        placeholder="e.g. 50" 
                                        className="input w-full mt-2 rounded-full bg-indigo-50 border-none
             focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                     transition-all duration-200 "
                                        value={newCharge}
                                        onChange={(e) => setNewCharge(e.target.value)}
                                        required 
                                    />
                                </div>
                                
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Serviceable PIN Codes</span>
                                    </label>
                                    <textarea 
                                        className="textarea w-full mt-2 rounded-xl bg-indigo-50 border-none md:col-span-2
             focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                     transition-all duration-200 resize-none" 
                                        placeholder="400001, 400002..."
                                        value={newPincodes}
                                        onChange={(e) => setNewPincodes(e.target.value)}
                                        required
                                    ></textarea>
                                    <label className="label">
                                        <span className="label-text-alt text-gray-400">Separate by comma or newline</span>
                                    </label>
                                </div>

                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <input 
                                            type="checkbox" 
                                            className="toggle toggle-success" 
                                            checked={isActive}
                                            onChange={(e) => setIsActive(e.target.checked)}
                                        />
                                        <span className="label-text font-medium">Enable Delivery for this Area</span>
                                    </label>
                                </div>

                                <div className="card-actions justify-end mt-4">
                                    <button 
                                        type="submit" 
                                        className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                                    >
                                        Add Shipping Rule
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Rules List */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-bold text-xl text-gray-700">Existing Shipping Rules</h3>
                    
                    {rules.length === 0 ? (
                        <div className="alert alert-info shadow-sm">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>No shipping rules defined yet. Add one to start.</span>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {rules.map(rule => (
                                <div key={rule.id} className="card bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                                    <div className="card-body p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="card-title text-lg">{rule.state}</h4>
                                            <div className="flex gap-2">
                                                 <input 
                                                    type="checkbox" 
                                                    className="toggle toggle-success toggle-sm" 
                                                    checked={rule.isActive} 
                                                    onChange={() => toggleStatus(rule)}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="text-2xl font-bold text-primary mb-3">
                                            ₹{rule.shippingCharge} <span className="text-sm font-normal text-gray-500">per order</span>
                                        </div>

                                        <div className="mt-4">
                                            <AccordionItem 
                                                title={`View ${rule.pinCodes?.length || 0} PIN Codes`}
                                                activeColor="bg-emerald-500"
                                                isOpen={openPinsId === rule.id}
                                                onClick={() => setOpenPinsId(openPinsId === rule.id ? null : rule.id)}
                                            >
                                                <div className="flex flex-wrap gap-1.5">
                                                    {rule.pinCodes?.slice(0, 50).map((pin, i) => (
                                                        <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold border border-emerald-100/50">
                                                            {pin}
                                                        </span>
                                                    ))}
                                                    {rule.pinCodes?.length > 50 && (
                                                        <span className="px-2 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-bold">
                                                            +{rule.pinCodes.length - 50} more
                                                        </span>
                                                    )}
                                                    {(!rule.pinCodes || rule.pinCodes.length === 0) && (
                                                        <span className="text-gray-400 italic text-xs">No PIN codes defined</span>
                                                    )}
                                                </div>
                                            </AccordionItem>
                                        </div>

                                        <div className="card-actions justify-end mt-4">
                                            <button 
                                                className="btn btn-active btn-error text-sm mt-18 text-white flex "
                                                onClick={() => handleDelete(rule.id)}
                                            >
                                                <MdDelete /> Delete Rule
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminShipping;
