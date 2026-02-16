import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { MdDelete, MdEdit, MdLocationOn, MdAdd } from 'react-icons/md';
import {FaPhoneAlt } from "react-icons/fa";
import TableSkeleton from '../../Component/Skeletons/TableSkeleton';


const AddressBook = () => {
    const { currentUser } = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        phone: ''
    });

    useEffect(() => {
        if (!currentUser) return;
        const q = collection(db, "users", currentUser.uid, "addresses");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAddresses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setPageLoading(false);
        });
        return unsubscribe;
    }, [currentUser]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!processFormValidation()) return;
        
        try {
            if (editingId) {
                await updateDoc(doc(db, "users", currentUser.uid, "addresses", editingId), formData);
                toast.success("Address updated");
            } else {
                await addDoc(collection(db, "users", currentUser.uid, "addresses"), formData);
                toast.success("New address added");
            }
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save address");
        }
    };

    const processFormValidation = () => {
        if (!formData.fullName || !formData.street || !formData.pincode) {
            toast.error("Please fill required fields");
            return false;
        }
        if (formData.pincode.length < 6) {
            toast.error("Invalid PIN Code");
            return false;
        }
        return true;
    };

    const handleDelete = async (id) => {
        if (confirm("Delete this address?")) {
            await deleteDoc(doc(db, "users", currentUser.uid, "addresses", id));
            toast.success("Address deleted");
        }
    };

    const handleEdit = (addr) => {
        setFormData(addr);
        setEditingId(addr.id);
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ fullName: '', street: '', city: '', state: '', pincode: '', phone: '' });
    };

    if (pageLoading) {
        return <div className="p-4"><TableSkeleton rows={4} columns={2} /></div>;
    }

   return (
  <div className="space-y-8 m-3">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
          <MdLocationOn className="text-emerald-600 text-xl" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">My Addresses</h2>
      </div>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition"
        >
          <MdAdd className="text-xl" />
          Add Address
        </button>
      )}
    </div>

    {/* Add / Edit Form */}
    {isAdding && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-5">
            {editingId ? "Edit Address" : "Add New Address"}
          </h3>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {[
              { label: "Full Name", name: "fullName" },
              { label: "Phone", name: "phone" },
              { label: "City", name: "city" },
              { label: "PIN Code", name: "pincode" },
            ].map(({ label, name }) => (
              <div key={name}>
                <label className="text-xs text-gray-500">{label}</label>
                <input
                  type="text"
                  name={name}
                  value={formData[name]}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ))}

            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Street Address</label>
              <textarea
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Select State</option>
                <option>Maharashtra</option>
                <option>Gujarat</option>
                <option>Karnataka</option>
                <option>Delhi</option>
                <option>Other</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Address List */}
    <div className="grid md:grid-cols-2 gap-4">
      {addresses.map((addr) => (
        <div
          key={addr.id}
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
        >
          <div className="flex justify-between gap-4">
            <div className="flex gap-3">
              <MdLocationOn className="text-emerald-500 text-xl mt-1" />
              <div>
                <h4 className="font-semibold text-gray-800">{addr.fullName}</h4>
                <p className="text-sm text-gray-500">
                  {addr.street}, {addr.city}, {addr.state} – {addr.pincode}
                </p>
                {addr.phone && (
                  <p className="text-sm text-gray-500 mt-1">
                     <FaPhoneAlt className='text-blue-500 inline-flex mb-1 '/>{addr.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(addr)}
                className="p-5 text-xl rounded-lg hover:bg-blue-50 text-blue-600"
              >
                <MdEdit />
              </button>
              <button
                onClick={() => handleDelete(addr.id)}
                className="p-5 text-xl rounded-lg hover:bg-red-50 text-red-600"
              >
                <MdDelete />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Empty State */}
    {addresses.length === 0 && !isAdding && (
      <div className="text-center py-10 text-gray-400">
        <MdLocationOn className="mx-auto text-4xl mb-2" />
        No saved addresses found
      </div>
    )}
  </div>
);

};

export default AddressBook;
