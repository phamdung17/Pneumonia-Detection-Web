import { Link } from "react-router-dom";
import { LockKeyhole, ShieldAlert } from "lucide-react";

interface AccessGateProps {
  mode: "login" | "forbidden";
  title?: string;
  description?: string;
}

export default function AccessGate({ mode, title, description }: AccessGateProps) {
  const isLogin = mode === "login";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${isLogin ? "bg-sky-50 text-primary" : "bg-amber-50 text-amber-600"}`}>
          {isLogin ? <LockKeyhole size={28} /> : <ShieldAlert size={28} />}
        </div>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-slate-900">
          {title || (isLogin ? "Dang nhap de tiep tuc" : "Ban khong co quyen truy cap")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {description || (isLogin
            ? "Tinh nang nay can du lieu that cua tai khoan. Vui long dang nhap de tiep tuc."
            : "Tai khoan hien tai khong du quyen de mo trang nay.")}
        </p>
        <div className="mt-8 flex gap-3">
          {isLogin ? (
            <>
              <Link to="/login" className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white">
                Dang nhap
              </Link>
              <Link to="/register" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">
                Dang ky
              </Link>
            </>
          ) : (
            <Link to="/predict" className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white">
              Quay lai chan doan
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
