import React, { useEffect, useState } from 'react';
import { getBlogs } from '../../services/adminService';
import BlogHero from './BlogHero';
import BlogCard from './BlogCard';
import BlogDetail from './BlogDetail';
import BlogCardSkeleton from '../../Component/Skeletons/BlogCardSkeleton';


const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);

  const categories = ['All', 'Newsletter', 'Tips', 'Insight', 'Success Stories'];

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await getBlogs();
        setBlogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const filteredBlogs =
    filter === 'All'
      ? blogs
      : blogs.filter(blog => blog.category === filter);

  if (selectedBlog) {
    return <BlogDetail blog={selectedBlog} onBack={() => setSelectedBlog(null)} />;
  }

  return (
    <div className="bg-white min-h-screen">
      <BlogHero />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Filter Menu */}
        <div className="flex items-center gap-3 overflow-x-auto pb-8 mb-8 hide-scrollbar">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest mr-4">Filter By</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300
                ${filter === cat
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 " >
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <BlogCardSkeleton key={i} />
            ))
          ) : (
            filteredBlogs.length > 0 ? (
                filteredBlogs.map(blog => (
                    <BlogCard 
                        key={blog.id} 
                        blog={blog} 
                        onClick={() => setSelectedBlog(blog)}
                    />
                ))
            ) : (
              <div className="col-span-full py-20 text-center">
                  <p className="text-gray-400 font-bold">No blogs found in this category.</p>
              </div>
            )
          )}
        </div>
      
      </main>
    </div>
  );
};

export default BlogPage;
