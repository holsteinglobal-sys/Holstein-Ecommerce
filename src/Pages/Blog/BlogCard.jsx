import React from "react";
import { getDirectGDriveUrl } from "../../utils/googleDriveConverter";

const BlogCard = ({ blog }) => {
  return (
    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Image */}
      <figure className="h-56 overflow-hidden">
        <img
          src={getDirectGDriveUrl(blog.image)}
          alt={blog.title}
          className="h-full w-full object-cover"
        />
      </figure>

      {/* Body */}
      <div className="card-body">
        <h2 className="card-title">
          {blog.title}
          <div className="badge badge-secondary">
            {blog.readTime}
          </div>
        </h2>

        <p className="text-gray-500 text-sm line-clamp-2">
          {blog.excerpt}
        </p>

        {/* Meta */}
        <div className="text-xs text-gray-400 flex items-center gap-2 mt-2">
          <span>{blog.date}</span>
          <span>•</span>
          <span>{blog.category}</span>
        </div>

        {/* Actions / Tags */}
        <div className="card-actions justify-end mt-4">
          <div className="badge badge-outline">{blog.category}</div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
