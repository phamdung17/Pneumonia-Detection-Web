export default function ConfirmDialog({ open, title, description, onConfirm, onCancel, confirmText = 'Xac nhan' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-md p-6">
        <div className="space-y-2">
          <h3 className="font-headline text-xl font-bold">{title}</h3>
          <p className="text-sm text-on-surface-variant">{description}</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onCancel}>Huy</button>
          <button className="btn-danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
