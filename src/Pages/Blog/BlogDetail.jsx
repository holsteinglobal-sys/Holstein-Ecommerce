import React from 'react';
import { MdArrowBack, MdAccessTime, MdPerson, MdCalendarToday } from 'react-icons/md';

const BlogDetail = ({ blog, onBack }) => {
  if (!blog) return null;

  return (
    <div className="animate-fade-in bg-white min-h-screen">
      {/* Hero / Header */}
      <div className="relative h-[50vh] min-h-[400px] w-full bg-gray-900">
        <img
          src={blog.image}
          alt={blog.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end">
          <div className="max-w-4xl mx-auto px-6 pb-12 w-full">
            <button
              onClick={onBack}
              className="mb-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                <MdArrowBack size={18} />
              </div>
              <span className="font-bold text-sm tracking-wide uppercase">Back to Blogs</span>
            </button>
            <div className="flex gap-2 mb-4">
              <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                {blog.category}
              </span>
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                {blog.readTime}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1]">
              {blog.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-8 pb-12 border-b border-gray-100 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
              <MdPerson size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Written By</p>
              <p className="text-sm font-black text-gray-900">{blog.author || 'Holstein Expert'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
              <MdCalendarToday size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Published On</p>
              <p className="text-sm font-black text-gray-900">{blog.date}</p>
            </div>
          </div>
        </div>

        {/* Article Body */}
        <div 
          className="blog-content text-gray-700 leading-relaxed text-lg lg:text-xl space-y-6"
          dangerouslySetInnerHTML={{ __html: blog.content || blog.excerpt }}
        />

        {/* Footer info */}
        <div className="mt-20 pt-12 border-t border-gray-100 italic text-gray-400 text-sm italic">
          Disclaimer: This information is for educational purposes. Consult a professional for specific advice on livestock nutrition.
        </div>
      </div>

      <style>{`
        .blog-content h1, .blog-content h2, .blog-content h3 {
          color: #111827;
          font-weight: 900;
          line-height: 1.2;
          margin-top: 2rem;
        }
        .blog-content h1 { font-size: 2.25rem; }
        .blog-content h2 { font-size: 1.875rem; }
        .blog-content h3 { font-size: 1.5rem; }
        .blog-content p { margin-bottom: 1.5rem; }
        .blog-content ul { 
          list-style-type: disc; 
          padding-left: 1.5rem; 
          margin-bottom: 1.5rem;
        }
        .blog-content ol { 
          list-style-type: decimal; 
          padding-left: 1.5rem; 
          margin-bottom: 1.5rem;
        }
        .blog-content li { margin-bottom: 0.5rem; }
        .blog-content img {
          border-radius: 1.5rem;
          margin: 2rem 0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .blog-content a {
          color: #3b82f6;
          text-decoration: underline;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default BlogDetail;
