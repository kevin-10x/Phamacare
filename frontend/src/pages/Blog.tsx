import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/blog').then((d) => setPosts(d.posts || [])).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-2">Health Blog</h1>
      <p className="text-ink/60 mb-8">Expert health advice from our licensed pharmacists.</p>
      {posts.length === 0 ? (
        <p className="text-ink/50">No articles yet.</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="card p-6 block group">
              <h2 className="font-display text-xl font-semibold group-hover:text-clove mb-2">{post.title}</h2>
              <p className="text-sm text-ink/60 mb-3">{post.excerpt}</p>
              <div className="flex items-center gap-3 text-xs text-ink/40">
                <span>{post.author}</span>
                <span>·</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
