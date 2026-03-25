import clsx from 'clsx';

export default function Pagination({ page, total, pageSize, onPageChange }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4 border-t border-surface-container p-6 md:flex-row md:items-center md:justify-between">
      <span className="text-sm text-on-surface-variant">Trang {page} / {pageCount} • {total} ban ghi</span>
      <div className="flex items-center gap-2">
        <button className="btn-secondary px-4 py-2" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          Truoc
        </button>
        {Array.from({ length: Math.min(pageCount, 5) }).map((_, index) => {
          const itemPage = index + 1;
          return (
            <button
              key={itemPage}
              className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold',
                itemPage === page ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface',
              )}
              onClick={() => onPageChange(itemPage)}
            >
              {itemPage}
            </button>
          );
        })}
        <button className="btn-secondary px-4 py-2" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>
          Sau
        </button>
      </div>
    </div>
  );
}
