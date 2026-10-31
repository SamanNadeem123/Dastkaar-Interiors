import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container-editorial flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-6xl text-walnut">404</p>
      <h1 className="mt-4 font-display text-2xl text-charcoal">This page went missing</h1>
      <p className="mt-2 max-w-sm font-body text-sm text-charcoal/60">
        The page you're looking for doesn't exist, or may have moved.
      </p>
      <Link to="/" className="btn-primary mt-8">
        Back to Home
      </Link>
    </div>
  );
}
