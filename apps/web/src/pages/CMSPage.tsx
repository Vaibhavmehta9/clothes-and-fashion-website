import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface CMSDoc {
  title: string;
  content: string;
}

const CMSPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<CMSDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const { data } = await api.get(`/pages/${slug}`);
        setPage(data.data);
      } catch {
        toast.error('Page not found.');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPage();
  }, [slug, navigate]);

  if (isLoading || !page) {
    return <div className="h-48 bg-muted animate-pulse rounded-2xl"></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-6">
      <h1 className="text-4xl font-display font-bold border-b border-border pb-4">{page.title}</h1>
      <div
        className="prose dark:prose-invert max-w-none text-charcoal-700 dark:text-charcoal-300 leading-relaxed text-sm flex flex-col gap-4"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
};

export default CMSPage;
