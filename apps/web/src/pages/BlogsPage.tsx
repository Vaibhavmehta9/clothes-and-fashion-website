import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  readTime: number;
}

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data } = await api.get('/blogs');
        setBlogs(data.data);
      } catch {
        toast.error('Failed to load editorial blogs.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (isLoading) {
    return <div className="h-48 bg-muted animate-pulse rounded-2xl"></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-xl mx-auto flex flex-col gap-3 mb-12">
        <span className="text-gold font-semibold uppercase tracking-widest text-xs">StyleVerse Editorial</span>
        <h1 className="text-4xl font-display font-bold">The Style Ledger</h1>
        <p className="text-muted-foreground text-sm">Discover fashion insights, styling guides, and premium lifestyle commentary curated by our design team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {blogs.map((b) => (
          <Link
            key={b._id}
            to={`/blogs/${b.slug}`}
            className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-6 flex flex-col gap-3">
              <span className="text-[10px] text-gold uppercase tracking-wider font-semibold">
                {b.readTime} Min Read
              </span>
              <h3 className="font-display font-bold text-lg leading-snug hover:text-gold transition-colors">
                {b.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {b.excerpt}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

import { Link } from 'react-router-dom';

export default BlogsPage;
