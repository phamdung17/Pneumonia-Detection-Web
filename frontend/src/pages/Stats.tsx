import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  BrainCircuit, 
  AlertTriangle, 
  Download,
  Info
} from "lucide-react";

const weeklyData = [
  { name: "T2", scans: 450, positive: 120 },
  { name: "T3", scans: 520, positive: 180 },
  { name: "T4", scans: 480, positive: 140 },
  { name: "T5", scans: 610, positive: 210 },
  { name: "T6", scans: 580, positive: 190 },
  { name: "T7", scans: 320, positive: 80 },
  { name: "CN", scans: 280, positive: 40 },
];


const StatsPage: React.FC = () => {
  return (
    <div className="space-y-10 pb-12">
      {/* Page Header */}
      <section>
        <h2 className="font-headline text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Chỉ số Hiệu suất</h2>
        <p className="text-slate-500 font-medium">Dữ liệu lâm sàng tổng hợp từ 30 ngày hoạt động gần nhất.</p>
      </section>

      {/* KPI Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-primary/20 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="text-primary" size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toàn cầu</span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Tổng số Chẩn đoán</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-black text-slate-900">12,482</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-red-100 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <div className="flex items-center text-red-500 gap-1">
              <TrendingUp size={14} />
              <span className="text-xs font-bold">+12.4%</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Ca Viêm phổi</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-black text-slate-900">3,241</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-100 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="text-emerald-500" size={20} />
            </div>
            <div className="flex items-center text-emerald-500 gap-1">
              <TrendingUp size={14} />
              <span className="text-xs font-bold">+5.2%</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Ca Bình thường</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-black text-slate-900">9,241</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-primary/20 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BrainCircuit className="text-primary" size={20} />
            </div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Độ chính xác cao</span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Độ tin cậy TB</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl font-black text-slate-900">98.4%</span>
          </div>
        </div>
      </section>

      {/* Main Charts Section */}
      <section className="grid grid-cols-1 gap-8">
        {/* Weekly Trend Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-headline text-xl font-extrabold text-slate-900">Xu hướng Hàng tuần</h3>
              <p className="text-sm text-slate-500 font-medium">Phân tích so sánh khối lượng quét hàng ngày</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Tổng số lượt quét
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Dương tính
              </div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="scans" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={32} opacity={0.2} />
                <Bar dataKey="positive" fill="#b91a24" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

    </div>
  );
};

export default StatsPage;
