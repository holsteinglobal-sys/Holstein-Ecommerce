import React, { useEffect, useState } from "react";
import { getAllReviews, updateReviewStatus, deleteReview, updateReviewData } from "../../services/adminService";
import toast from "react-hot-toast";
import { MdDelete, MdVisibility, MdVisibilityOff, MdStar, MdEdit } from "react-icons/md";
import { IoCloseSharp } from "react-icons/io5";
import TableSkeleton from "../../Component/Skeletons/TableSkeleton";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await getAllReviews();
      setReviews(data);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (reviewId, currentStatus) => {
    const newStatus = currentStatus === "approved" ? "rejected" : "approved";
    try {
      await updateReviewStatus(reviewId, newStatus);
      toast.success(`Review ${newStatus === 'approved' ? 'approved' : 'hidden'}`);
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteReview(id);
      toast.success("Review deleted");
      setReviews(reviews.filter(r => r.id !== id));
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingReview || !editingReview.comment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateReviewData(editingReview.id, {
        comment: editingReview.comment,
        rating: editingReview.rating
      });
      toast.success("Review updated successfully");
      setReviews(reviews.map(r => r.id === editingReview.id ? { ...r, comment: editingReview.comment, rating: editingReview.rating } : r));
      setEditingReview(null);
    } catch (error) {
      console.error("Edit review error:", error);
      toast.error("Failed to update review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={6} columns={4} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Reviews Moderation</h2>
          <p className="text-sm text-gray-500">Manage customer feedback across all products</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed text-gray-400">
            No reviews found.
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">{review.userName}</span>
                  <span className="text-xs text-primary font-medium">{review.productTitle || 'Unknown Product'}</span>
                </div>
                <div className="flex gap-1">
                   <button
                    onClick={() => handleToggleStatus(review.id, review.status)}
                    className={`p-2 rounded-xl transition-colors ${
                      review.status === 'approved' 
                        ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                        : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                    }`}
                    title={review.status === 'approved' ? 'Hide Review' : 'Approve Review'}
                  >
                    {review.status === 'approved' ? <MdVisibility /> : <MdVisibilityOff />}
                  </button>
                  <button
                    onClick={() => setEditingReview(review)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                    title="Edit Review"
                  >
                    <MdEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                    title="Delete Review"
                  >
                    <MdDelete />
                  </button>
                </div>
              </div>

              <div className="flex text-yellow-400 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <MdStar key={star} className={star <= review.rating ? "fill-current" : "text-gray-200"} />
                ))}
              </div>

              <p className="text-gray-600 text-sm italic mb-4">"{review.comment}"</p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 uppercase tracking-tighter  font-black">
                <span className="text-[10px] text-gray-400">
                  {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'N/A'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  review.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {review.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT MODAL */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Review</h2>
              <button
                onClick={() => setEditingReview(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
              >
                <IoCloseSharp size={24} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Review Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditingReview({ ...editingReview, rating: star })}
                      className={`text-3xl transition-transform hover:scale-110 ${
                        star <= editingReview.rating ? "text-yellow-400" : "text-slate-200"
                      }`}
                    >
                      <MdStar />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Review Comment</label>
                <textarea
                  value={editingReview.comment}
                  onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[150px] resize-none transition-all"
                  placeholder="Update customer feedback..."
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 px-6 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
