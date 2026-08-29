import Link from "next/link";

export function NotFoundView() {
  return (
    <div className="container-main grid min-h-[55vh] place-items-center py-12 text-center">
      <div>
        <p className="text-8xl font-black text-[var(--line)]">404</p>
        <h1 className="mt-3 text-3xl font-black">यह पेज अखाड़े में नहीं मिला</h1>
        <p className="muted mt-3 max-w-md mx-auto">लिंक बदल गया हो सकता है या खबर/ब्लॉग उपलब्ध नहीं है।</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link className="btn btn-primary" href="/">
            होम पर लौटें
          </Link>
          <Link className="btn btn-ghost" href="/blog">
            ब्लॉग देखें
          </Link>
          <Link className="btn btn-ghost" href="/search">
            खबर खोजें
          </Link>
        </div>
      </div>
    </div>
  );
}
