import Link from "next/link";

export function NotFoundView() {
  return (
    <div className="container-main grid min-h-[55vh] place-items-center py-12 text-center">
      <div>
        <p className="text-8xl font-black text-[var(--line)]">404</p>
        <h1 className="mt-3 text-3xl font-black">यह पेज अखाड़े में नहीं मिला</h1>
        <p className="muted mt-3">लिंक बदल गया हो सकता है या खबर उपलब्ध नहीं है।</p>
        <Link className="btn btn-primary mt-6" href="/">
          होम पर लौटें
        </Link>
      </div>
    </div>
  );
}
