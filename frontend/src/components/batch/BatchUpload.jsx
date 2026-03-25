export default function BatchUpload({ previews, onFiles }) {
  return (
    <label className="group relative flex h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-200 bg-surface-container-lowest transition-all hover:border-primary hover:bg-sky-50/50">
      <input className="hidden" type="file" accept="image/png,image/jpeg,image/jpg" multiple onChange={(event) => onFiles?.(event.target.files)} />
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 transition-transform group-hover:scale-110">
        <span className="material-symbols-outlined text-3xl text-primary">cloud_upload</span>
      </div>
      <h3 className="font-headline text-lg font-bold text-on-surface">Drop DICOM or PNG files here</h3>
      <p className="mt-1 text-sm text-on-surface-variant">Up to 50 files per batch • Max 20MB per file</p>
      {previews.length ? (
        <p className="mt-4 rounded-full bg-primary-fixed px-4 py-2 text-sm font-semibold text-primary">{previews.length} files selected</p>
      ) : (
        <button type="button" className="mt-6 rounded-lg bg-surface-container-high px-6 py-2 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-highest">
          Browse Local Storage
        </button>
      )}
    </label>
  );
}
