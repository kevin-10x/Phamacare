import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    api.get(`/api/blog/${slug}`).then((d) => setPost(d.post)).catch(() => {});
  }, [slug]);

  if (!post) return <div className="max-w-3xl mx-auto px-4 py-16">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/blog" className="text-clove text-sm hover:underline mb-6 inline-block">← Back to blog</Link>
      <h1 className="font-display text-3xl font-semibold mb-4">{post.title}</h1>
      <div className="flex items-center gap-3 text-sm text-ink/50 mb-8">
        <span>{post.author}</span>
        <span>·</span>
        <span>{new Date(post.created_at).toLocaleDateString()}</span>
      </div>
      <div className="prose max-w-none text-ink/80 whitespace-pre-line leading-relaxed">
        {post.content}
      </div>
    </div>
  );
}
