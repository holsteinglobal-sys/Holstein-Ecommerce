import React, { useEffect, useState } from "react";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  toggleProductVisibility,
  getCategories,
  generateSlug,
} from "../../services/adminService";
import toast from "react-hot-toast";
import { getDirectGDriveUrl } from "../../utils/googleDriveConverter";
import { MdEdit, MdDelete, MdVisibility, MdVisibilityOff, MdAdd } from "react-icons/md";
import TableSkeleton from "../../Component/Skeletons/TableSkeleton";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const initialFormState = {
    title: "",
    category: "",
    subcategory: "",
    description: "",
    longDescription: "",
    price: "",
    oldPrice: "",
    Quantity: "",
    image: "", // Main image
    ProductDetails: [""], // Dynamic gallery images
    isVisible: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddImageField = () => {
    setFormData({
      ...formData,
      ProductDetails: [...formData.ProductDetails, ""],
    });
  };

  const handleRemoveImageField = (index) => {
    const newImages = formData.ProductDetails.filter((_, i) => i !== index);
    setFormData({ ...formData, ProductDetails: newImages });
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.ProductDetails];
    newImages[index] = value;
    
    setFormData({ 
      ...formData, 
      ProductDetails: newImages,
      // Automatically set the first image as the main 'image' if not manually set
      image: index === 0 ? getDirectGDriveUrl(value) : formData.image 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingProduct ? "Updating product..." : "Adding product...");

    try {
      // Filter out empty strings and convert all URLs
      const filteredGallery = formData.ProductDetails
        .filter(url => url.trim() !== "")
        .map(url => getDirectGDriveUrl(url));

      const processedData = {
        ...formData,
        price: Number(formData.price),
        oldPrice: formData.oldPrice ? Number(formData.oldPrice) : null,
        slug: generateSlug(formData.title),
        // The main thumbnail is either the manually set 'image' or the first one from gallery
        image: getDirectGDriveUrl(formData.image) || (filteredGallery.length > 0 ? filteredGallery[0] : ""),
        ProductDetails: filteredGallery,
        updatedAt: new Date().toISOString(),
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, processedData);
        toast.success("Product updated successfully", { id: loadingToast });
      } else {
        await addProduct({
          ...processedData,
          createdAt: new Date().toISOString(),
        });
        toast.success("Product added successfully", { id: loadingToast });
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData(initialFormState);
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save product", { id: loadingToast });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || "",
      category: product.category || "",
      subcategory: product.subcategory || "",
      description: product.description || "",
      longDescription: product.longDescription || "",
      price: product.price || "",
      oldPrice: product.oldPrice || "",
      Quantity: product.Quantity || "",
      image: product.image || "",
      ProductDetails: product.ProductDetails?.length ? product.ProductDetails : [""],
      isVisible: product.isVisible ?? true,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        toast.success("Product deleted");
        loadProducts();
      } catch (error) {
        toast.error("Delete failed");
      }
    }
  };

  const handleToggleVisibility = async (product) => {
    try {
      await toggleProductVisibility(product.id, product.isVisible);
      toast.success(`Product ${product.isVisible ? "hidden" : "visible"}`);
      loadProducts();
    } catch (error) {
      toast.error("Toggle visibility failed");
    }
  };

  const handleMigrateSlugs = async () => {
    if (!window.confirm("This will generate SEO-friendly URLs for all products. Continue?")) return;
    
    const loadingToast = toast.loading("Migrating slugs...");
    try {
      let count = 0;
      for (const product of products) {
        if (!product.slug) {
          await updateProduct(product.id, { 
            slug: generateSlug(product.title) 
          });
          count++;
        }
      }
      toast.success(`Successfully migrated ${count} products!`, { id: loadingToast });
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error("Migration failed", { id: loadingToast });
    }
  };

  if (loading) {
    return <TableSkeleton rows={8} columns={5} />;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Google Drive Link Help Alert */}
      {/* <div className="m-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl">
        <div className="flex"> */}
          {/* <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div> */}
          {/* <div className="ml-3">
            <p className="text-sm text-blue-700 font-bold">How to List Products : </p>
            <ol className="text-xs text-blue-600 list-decimal ml-4 mt-1">
              <li></li>
              <li>Click "Share" and select "Anyone with the link".</li>
              <li>Set the role to "Viewer" and click "Copy Link".</li>
              <li>Paste the link below; it will be converted automatically!</li>
            </ol>
          </div> */}
        {/* </div>
      </div> */}

      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Products Management</h2>
          <p className="text-sm text-gray-500">Manage your store products dynamically</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleMigrateSlugs}
            className="btn btn-outline btn-primary rounded-xl"
            title="Generate URLs for all products"
          >
            Fix Product URLs
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData(initialFormState);
              setShowModal(true);
            }}
            className="btn btn-primary rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <MdAdd className="text-xl" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="text-gray-600 font-semibold py-4">Product</th>
              <th className="text-gray-600 font-semibold py-4">Category</th>
              <th className="text-gray-600 font-semibold py-4">Price</th>
              <th className="text-gray-600 font-semibold py-4 text-center">Status</th>
              <th className="text-gray-600 font-semibold py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-100 flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/150?text=No+Image";
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{product.title}</div>
                      <div className="text-xs text-gray-400 capitalize">{product.Quantity}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium border border-indigo-100">
                    {product.category}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">₹{product.price}</span>
                    {product.oldPrice && (
                      <span className="text-xs text-gray-400 line-through">₹{product.oldPrice}</span>
                    )}
                  </div>
                </td>
                <td className="py-4 text-center">
                  <button
                    onClick={() => handleToggleVisibility(product)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      product.isVisible
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : "bg-red-50 text-red-600 border border-red-100"
                    }`}
                  >
                    {product.isVisible ? (
                      <>
                        <MdVisibility className="text-sm" /> Visible
                      </>
                    ) : (
                      <>
                        <MdVisibilityOff className="text-sm" /> Hidden
                      </>
                    )}
                  </button>
                </td>
                <td className="py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <MdEdit className="text-xl" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <MdDelete className="text-xl" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-12 text-gray-500">
                  No products found. Start by adding one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label font-semibold text-gray-700">Product Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input input-bordered w-full focus:border-primary rounded-xl"
                    placeholder="Product name..."
                  />
                </div>

                <div className="form-control">
                  <label className="label font-semibold text-gray-700">Category</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: "" })}
                    className="select select-bordered w-full focus:border-primary rounded-xl"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label font-semibold text-gray-700">Subcategory</label>
                  <select
                    required
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="select select-bordered w-full focus:border-primary rounded-xl"
                  >
                    <option value="">Select Subcategory</option>
                    {categories
                      .find((cat) => cat.name === formData.category)
                      ?.subcategories?.map((sub, i) => (
                        <option key={i} value={sub}>{sub}</option>
                      ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label font-semibold text-gray-700">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input input-bordered w-full focus:border-primary rounded-xl"
                    placeholder="Price in INR"
                  />
                </div>

                <div className="form-control">
                  <label className="label font-semibold text-gray-700">Old Price (₹) - Optional</label>
                  <input
                    type="number"
                    value={formData.oldPrice}
                    onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                    className="input input-bordered w-full focus:border-primary rounded-xl"
                    placeholder="Old price for discount badge"
                  />
                </div>

                <div className="form-control">
                  <label className="label font-semibold text-gray-700">Quantity / Size</label>
                  <input
                    type="text"
                    required
                    value={formData.Quantity}
                    onChange={(e) => setFormData({ ...formData, Quantity: e.target.value })}
                    className="input input-bordered w-full focus:border-primary rounded-xl"
                    placeholder="e.g. 50 Kg"
                  />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label font-semibold text-gray-700 flex justify-between">
                    <div>
                      <span>Product Gallery Images (Links)</span>
                      <p className="text-[10px] text-gray-400 font-normal">Pasted links are automatically converted to images</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddImageField}
                      className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                    >
                      <MdAdd /> Add More Images
                    </button>
                  </label>
                  <div className="space-y-4">
                    {formData.ProductDetails.map((url, index) => (
                      <div key={index} className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              required={index === 0}
                              value={url}
                              onChange={(e) => handleImageChange(index, e.target.value)}
                              className="input input-bordered w-full focus:border-primary rounded-xl"
                              placeholder={`Paste image link ${index + 1} here...`}
                            />
                            {index === 0 && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                MAIN
                              </span>
                            )}
                          </div>
                          {formData.ProductDetails.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImageField(index)}
                              className="btn btn-error btn-square btn-outline rounded-xl"
                              title="Remove"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        
                        {/* Real-time Preview */}
                        {url && (
                          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                             <div className="w-16 h-16 rounded-lg bg-white overflow-hidden border border-gray-100 flex-shrink-0 animate-fadeIn">
                               <img 
                                 src={getDirectGDriveUrl(url)} 
                                 alt={`Preview ${index + 1}`}
                                 className="w-full h-full object-contain"
                                 onError={(e) => {
                                   e.target.style.display = 'none';
                                   e.target.parentNode.innerHTML = '<div class="flex items-center justify-center h-full text-[10px] text-red-500 font-bold text-center p-1">Broken Link</div>';
                                 }}
                               />
                             </div>
                             <div className="flex-1 text-[10px] text-gray-500 truncate italic">
                               {url}
                             </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-control">
                <label className="label font-semibold text-gray-700">Short Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea textarea-bordered w-full h-20 focus:border-primary rounded-xl resize-none"
                  placeholder="A short tagline for the product..."
                />
              </div>

              <div className="form-control">
                <label className="label font-semibold text-gray-700">Long Description</label>
                <textarea
                  required
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  className="textarea textarea-bordered w-full h-32 focus:border-primary rounded-xl resize-none"
                  placeholder="Detailed product information..."
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
                <button
                  type="submit"
                  className="btn btn-primary flex-1 rounded-xl shadow-lg"
                >
                  {editingProduct ? "Update Product" : "Save Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline flex-1 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;