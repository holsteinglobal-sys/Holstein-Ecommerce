import React, { useState, useEffect } from "react";
import { getCategories, saveCategory, deleteCategory } from "../../services/adminService";
import toast from "react-hot-toast";
import { MdAdd, MdDelete, MdEdit, MdCategory, MdKeyboardArrowDown, MdLayers } from "react-icons/md";
import TableSkeleton from "../../Component/Skeletons/TableSkeleton";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", subcategories: [""] });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubcategoryField = () => {
    setFormData({
      ...formData,
      subcategories: [...formData.subcategories, ""],
    });
  };

  const handleRemoveSubcategoryField = (index) => {
    const newSubs = formData.subcategories.filter((_, i) => i !== index);
    setFormData({ ...formData, subcategories: newSubs });
  };

  const handleSubcategoryChange = (index, value) => {
    const newSubs = [...formData.subcategories];
    newSubs[index] = value;
    setFormData({ ...formData, subcategories: newSubs });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    const processedData = {
      name: formData.name.trim(),
      subcategories: formData.subcategories
        .filter((s) => s.trim() !== "")
        .map((s) => s.trim()),
      updatedAt: new Date().toISOString(),
    };

    const loadingToast = toast.loading(editingCategory ? "Updating..." : "Saving...");
    try {
      await saveCategory(editingCategory?.id, processedData);
      toast.success("Category saved successfully", { id: loadingToast });
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: "", subcategories: [""] });
      loadCategories();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save category", { id: loadingToast });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      subcategories: category.subcategories?.length ? category.subcategories : [""],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure? This may affect products in this category.")) {
      try {
        await deleteCategory(id);
        toast.success("Category deleted");
        loadCategories();
      } catch (error) {
        toast.error("Delete failed");
      }
    }
  };

  const seedDefaults = async () => {
    const defaults = {
      name: "Animal Feeds",
      subcategories: ["Cow Feeds", "Bull Feeds", "Buff Feeds", "Swine Feeds", "Dog Feeds"],
      updatedAt: new Date().toISOString(),
    };
    
    const loadingToast = toast.loading("Seeding defaults...");
    try {
      await saveCategory(null, defaults);
      toast.success("Defaults seeded!", { id: loadingToast });
      loadCategories();
    } catch (error) {
      toast.error("Seed failed", { id: loadingToast });
    }
  };

  if (loading && categories.length === 0) {
    return <TableSkeleton rows={6} columns={4} />;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Category Management</h2>
          <p className="text-sm text-gray-500">Manage main categories and their subcategories</p>
        </div>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <button onClick={seedDefaults} className="btn btn-outline btn-sm rounded-xl">
              Seed Defaults
            </button>
          )}
          <button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: "", subcategories: [""] });
              setShowModal(true);
            }}
            className="btn btn-primary rounded-xl flex items-center gap-2"
          >
            <MdAdd className="text-xl" />
            Add Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <MdCategory className="text-xl" />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{cat.name}</h3>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(cat)} className="btn btn-ghost btn-xs btn-square text-blue-600">
                  <MdEdit />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="btn btn-ghost btn-xs btn-square text-red-600">
                  <MdDelete />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <MdLayers /> Subcategories ({cat.subcategories?.length || 0})
              </p>
              <div className="flex flex-wrap gap-2">
                {cat.subcategories?.map((sub, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs text-gray-600 font-medium">
                    {sub}
                  </span>
                )) || <span className="text-xs text-gray-400 italic">No subcategories</span>}
              </div>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400">
            No categories found. Build your hierarchy to organize products.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn btn-sm btn-circle btn-ghost">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="form-control">
                <label className="label font-semibold text-gray-700">Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input input-bordered w-full rounded-xl"
                  placeholder="e.g. Animal Feeds"
                />
              </div>

              <div className="form-control">
                <label className="label font-semibold text-gray-700 flex justify-between">
                  <span>Subcategories</span>
                  <button type="button" onClick={handleAddSubcategoryField} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
                    <MdAdd /> Add Subcategory
                  </button>
                </label>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {formData.subcategories.map((sub, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={sub}
                        onChange={(e) => handleSubcategoryChange(index, e.target.value)}
                        className="input input-bordered flex-1 rounded-xl h-10 text-sm"
                        placeholder={`Subcategory ${index + 1}`}
                      />
                      {formData.subcategories.length > 1 && (
                        <button type="button" onClick={() => handleRemoveSubcategoryField(index)} className="btn btn-ghost btn-sm text-red-500">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button type="submit" className="btn btn-primary flex-1 rounded-xl">Save Hierarchy</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline flex-1 rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
