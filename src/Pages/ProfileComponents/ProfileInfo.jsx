import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc, getDoc,onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { CgProfile } from 'react-icons/cg';
import {FaUser ,FaEdit ,FaEnvelope ,FaPhoneAlt ,FaCalendar
} from "react-icons/fa";
import TableSkeleton from '../../Component/Skeletons/TableSkeleton';


const ProfileInfo = () => {
    const { currentUser } = useAuth();
    const [name, setName] = useState(currentUser?.displayName || '');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);


    useEffect(() => {
        if(currentUser) {
            const unsubscribe = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
                if(docSnap.exists()) {
                    const data = docSnap.data();
                    setName(data.displayName || '');
                    setPhone(data.phone || '');
                }
                setPageLoading(false);
            });
            return unsubscribe;
        }
    }, [currentUser]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                displayName: name,
                phone: phone
            });
            toast.success("Profile Updated Successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// const getDefaultAvatar = (name) =>
//   `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=10B981&color=fff`;


    if (pageLoading) {
        return <div className="p-8"><TableSkeleton rows={4} columns={2} /></div>;
    }

    return (
      <>
  <div className="p-4 lg:p-8">
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        {/* Cover */}
        <div className="h-32 bg-[#1059b9]" />

        {/* Avatar Section */}
        <div className="relative px-6 pb-6">
         <div className="absolute -top-16 left-6">
  <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg bg-emerald-600 flex items-center justify-center">
    <span className="text-5xl font-bold text-white">
      {(name || "User").charAt(0).toUpperCase()}
    </span>
  </div>
</div>


          {/* Edit Button */}
          <div className="flex justify-end pt-4">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex flex-wrap gap-2  "
              >
                <FaEdit className='flex mt-1' />
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="mt-10">
            {!isEditing ? (
              <div className="space-y-6">

                {/* Name */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FaUser  className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="text-lg font-semibold">{name || "N/A"}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                   <FaEnvelope className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-lg font-semibold">{currentUser?.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FaPhoneAlt className='text-orange-600 text-xl'/>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-lg font-semibold">{phone}</p>
                  </div>
                </div>

                {/* Member Since */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FaCalendar className="text-purple-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="text-lg font-semibold">
                      {formatDate(currentUser?.metadata?.creationTime)}
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              /* EDIT FORM */
              <form onSubmit={handleUpdate} className="space-y-6">

                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#10B981] text-white font-semibold rounded-xl"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>

              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
</>

    );
};

export default ProfileInfo;
