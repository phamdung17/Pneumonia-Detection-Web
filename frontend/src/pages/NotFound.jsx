import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="panel max-w-xl p-10 text-center">
        <h1 className="font-headline text-6xl font-extrabold">404</h1>
        <p className="mt-4 text-on-surface-variant">Trang ban tim khong ton tai trong he thong.</p>
        <Link className="btn-primary mt-6" to="/predict">Quay lai chan doan</Link>
      </div>
    </div>
  );
}
