import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-semibold mb-4">Page not found</h1>
      <p className="text-ink/60 mb-8">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary">Back to home</Link>
    </div>
  );
}
