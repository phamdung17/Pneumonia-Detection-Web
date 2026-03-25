export default function FilterBar({ filters, setFilters, onReset }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 items-end">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Status</label>
          <select className="field" value={filters.prediction} onChange={(e) => setFilters((prev) => ({ ...prev, prediction: e.target.value }))}>
            <option value="">All Status</option>
            <option value="PNEUMONIA">Pneumonia</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Confidence</label>
          <select className="field" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">All Confidence</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SUSPECTED">Suspected</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Date Range</label>
          <input className="field" type="date" value={filters.date_from} placeholder="Select dates" onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">&nbsp;</label>
          <input className="field" type="date" value={filters.date_to} onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))} />
        </div>
        <button className="flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-container" onClick={onReset}>
          <span className="material-symbols-outlined text-base">refresh</span>
          Reset Filters
        </button>
      </div>
    </div>
  );
}
