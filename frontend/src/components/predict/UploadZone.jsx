export default function UploadZone({ title = 'Upload Chest X-ray', subtitle = 'Drag and drop DICOM, JPEG, or PNG files here.\nMax file size: 25MB', multiple = false, onFiles, previews = [] }) {
  return (
    <label className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center transition-all hover:border-primary-container group">
      <input
        className="hidden"
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        multiple={multiple}
        onChange={(event) => onFiles?.(event.target.files)}
      />
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed transition-transform group-hover:scale-110">
        <span className="material-symbols-outlined text-3xl text-primary">upload_file</span>
      </div>
      <h3 className="font-headline text-lg font-bold text-on-surface mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant text-center mb-6 whitespace-pre-line">{subtitle}</p>
      {previews.length ? (
        <div className="mt-2 grid w-full gap-3 text-left">
          {previews.map((preview) => (
            <div key={preview.url} className="rounded-lg bg-surface-container-low p-4">
              <p className="truncate text-sm font-semibold">{preview.name}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{Math.round(preview.size / 1024)} KB</p>
            </div>
          ))}
        </div>
      ) : (
        <button type="button" className="rounded-full bg-surface-container-high px-6 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary-container hover:text-white">
          Browse Files
        </button>
      )}
    </label>
  );
}
