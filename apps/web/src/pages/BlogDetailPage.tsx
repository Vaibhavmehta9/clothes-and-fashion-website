import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Blog {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  readTime: number;
  publishedAt: string;
}

const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const { data } = await api.get(`/blogs/${slug}`);
        setBlog(data.data);
      } catch {
        toast.error('Failed to load blog post.');
        navigate('/blogs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlog();
  }, [slug, navigate]);

  if (isLoading || !blog) {
    return <div className="h-48 bg-muted animate-pulse rounded-2xl"></div>;
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-6">
      <div className="flex flex-col gap-3 text-center">
        <span className="text-gold font-semibold uppercase tracking-widest text-xs">
          {blog.readTime} Min Read
        </span>
        <h1 className="text-4xl font-display font-bold leading-tight">{blog.title}</h1>
        <span className="text-xs text-muted-foreground">
          Published on {new Date(blog.publishedAt).toLocaleDateString('en-IN')}
        </span>
      </div>

      <div className="aspect-[16/9] rounded-3xl overflow-hidden bg-muted my-4 border border-border">
        <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
      </div>

      <div
        className="prose dark:prose-invert max-w-none text-charcoal-700 dark:text-charcoal-300 leading-relaxed text-sm flex flex-col gap-4"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </article>
  );
};

export default BlogDetailPage;
