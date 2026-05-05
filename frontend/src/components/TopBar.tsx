import { Bell, Search, Settings } from "lucide-react";

export default function TopBar() {
  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200/50 bg-white/70 px-6 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
      <div className="flex items-center gap-8">
        <span className="font-headline text-xl font-bold tracking-tighter text-primary">Aetheris Clinical</span>
        <nav className="hidden items-center gap-6 md:flex">
          <a className="font-headline text-sm tracking-tight text-slate-500 transition-colors hover:text-primary" href="#">Tổng quan</a>
          <a className="font-headline text-sm tracking-tight text-slate-500 transition-colors hover:text-primary" href="#">Hồ sơ bệnh nhân</a>
          <a className="font-headline text-sm tracking-tight text-slate-500 transition-colors hover:text-primary" href="#">Báo cáo xét nghiệm</a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-64 rounded-full border-none bg-slate-100 py-1.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder="Tìm mã chẩn đoán..."
            type="text"
          />
        </div>

        <button className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-50">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-tertiary"></span>
        </button>

        <button className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-50">
          <Settings size={20} />
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-2">
          <div className="hidden text-right lg:block">
            <p className="text-xs font-bold text-slate-900">Dr. Julian Vane</p>
            <p className="text-[10px] font-medium text-slate-500">Trưởng nhóm lâm sàng</p>
          </div>
          <img
            alt="Dr. Julian Vane"
            className="h-8 w-8 rounded-full object-cover ring-2 ring-primary-container/20"
            src="https://picsum.photos/seed/doctor/100/100"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
