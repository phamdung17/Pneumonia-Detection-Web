import { useState } from 'react';

export default function DoctorNote({ note, canEdit, onSave, onConfirm }) {
  const [value, setValue] = useState(note ?? '');

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm flex-1">
        <h4 className="font-headline text-sm font-bold mb-4">Clinical Observations</h4>
        <textarea
          className="h-32 w-full rounded-lg border-none bg-surface-container-low p-3 text-sm focus:ring-1 focus:ring-primary placeholder:text-slate-400"
          disabled={!canEdit}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Type diagnostic notes here..."
        />
      </div>
      {canEdit ? (
        <div className="flex gap-3">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90"
            onClick={() => { onSave?.(value); onConfirm?.(true); }}
          >
            <span className="material-symbols-outlined text-sm">verified</span>
            Confirm
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-container-highest py-3 text-sm font-bold text-on-surface-variant transition-all hover:bg-error-container hover:text-error"
            onClick={() => onConfirm?.(false)}
          >
            <span className="material-symbols-outlined text-sm">cancel</span>
            Disagree
          </button>
        </div>
      ) : null}
    </div>
  );
}
