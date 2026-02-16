import React from "react";
import { getDirectGDriveUrl } from "../../utils/googleDriveConverter";
import { MdAccessTime, MdArrowForward, MdPerson, MdCalendarToday } from "react-icons/md";

const BlogCard = ({ blog, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-2 cursor-pointer flex flex-col h-full"
    >
      {/* Featured Image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={getDirectGDriveUrl(blog.image)}
          alt={blog.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-6 left-6 flex gap-2">
            <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-sm">
                {blog.category}
            </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-8 flex flex-col flex-1">
        {/* Meta */}
        <div className="flex items-center gap-4 mb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl">
                <MdCalendarToday size={14} className="text-primary" />
                <span>{blog.date}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl">
                <MdAccessTime size={14} className="text-secondary" />
                <span>{blog.readTime || '5 min read'}</span>
            </div>
        </div>

        <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-snug mb-4 group-hover:text-primary transition-colors line-clamp-2">
          {blog.title}
        </h3>

        <p className="text-gray-500 font-medium leading-relaxed mb-6 line-clamp-3">
          {blog.excerpt}
        </p>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm">
                    {blog.author ? blog.author.charAt(0) : <MdPerson size={20} />}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Author</p>
                    <p className="text-[13px] font-black text-gray-900">{blog.author || 'Holstein Feeds'}</p>
                </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-gray-50 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-300">
                <MdArrowForward size={22} className="transition-transform group-hover:translate-x-1" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
