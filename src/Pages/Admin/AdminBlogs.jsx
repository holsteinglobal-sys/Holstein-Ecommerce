import React, { useEffect, useState } from "react";
import {
  getBlogs,
  addBlog,
  updateBlog,
  deleteBlog,
} from "../../services/adminService";
import toast from "react-hot-toast";
import { getDirectGDriveUrl } from "../../utils/googleDriveConverter";

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    excerpt: "",
    image: "",
    readTime: "",
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      const data = await getBlogs();
      setBlogs(data);
    } catch {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      excerpt: "",
      image: "",
      readTime: "",
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const processedFormData = {
        ...formData,
        image: getDirectGDriveUrl(formData.image)
      };

      if (editingBlog) {
        await updateBlog(editingBlog.id, processedFormData);
        toast.success("Blog updated");
      } else {
        await addBlog(processedFormData);
        toast.success("Blog added");
      }

      setShowForm(false);
      setEditingBlog(null);
      resetForm();
      loadBlogs();
    } catch {
      toast.error("Failed to save blog");
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      category: blog.category,
      excerpt: blog.excerpt,
      image: blog.image,
      readTime: blog.readTime,
      date: blog.date,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this blog?")) return;

    try {
      await deleteBlog(id);
      toast.success("Blog deleted");
      loadBlogs();
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading blogs...</div>;
  }


  const convertDriveUrl = (url) => {
  const match = url.match(/\/d\/([^/]+)\//);
  if (!match) return url; // not a drive link, return as-is

  const fileId = match[1];
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Blogs</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingBlog(null);
            resetForm();
          }}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Add Blog
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-base-100 p-6 rounded shadow mb-6 space-y-4"
        >
          <input
            placeholder="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="input input-bordered w-full"
            required
          />

          <input
            placeholder="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="input input-bordered w-full"
            required
          />

          <textarea
            placeholder="Excerpt"
            value={formData.excerpt}
            onChange={(e) =>
              setFormData({ ...formData, excerpt: e.target.value })
            }
            className="textarea textarea-bordered w-full"
            required
          />

          {/* <input
            placeholder="Image URL"
            value={formData.image}
            onChange={(e) =>
              setFormData({ ...formData, image: e.target.value })
            }
            className="input input-bordered w-full"
            required
          /> */}

         <input
  placeholder="Image URL"
  value={formData.image}
  onChange={(e) =>
    setFormData({ ...formData, image: e.target.value })
  }
  className="input input-bordered w-full"
  required
/>




          <input
            placeholder="Read time (e.g. 5 min read)"
            value={formData.readTime}
            onChange={(e) =>
              setFormData({ ...formData, readTime: e.target.value })
            }
            className="input input-bordered w-full"
            required
          />

          <div className="flex gap-3">
            <button className="btn btn-primary">
              {editingBlog ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingBlog(null);
                resetForm();
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <table className="table w-full bg-base-100 shadow">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {blogs.map((blog) => (
            <tr key={blog.id}>
              <td>{blog.title}</td>
              <td>{blog.category}</td>
              <td>{blog.date}</td>
              <td className="space-x-2">
                <button
                  onClick={() => handleEdit(blog)}
                  className="btn btn-sm btn-info"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(blog.id)}
                  className="btn btn-sm btn-error"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBlogs;
