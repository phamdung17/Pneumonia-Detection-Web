import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="panel max-w-xl p-10 text-center">
        <h1 className="font-headline text-6xl font-extrabold">403</h1>
        <p className="mt-4 text-on-surface-variant">Ban khong co quyen truy cap khu vuc nay.</p>
        <Link className="btn-primary mt-6" to="/predict">Ve trang chinh</Link>
      </div>
    </div>
  );
}
