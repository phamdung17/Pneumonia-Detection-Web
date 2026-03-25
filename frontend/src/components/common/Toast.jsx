import { LoaderCircle } from 'lucide-react';

export function ToastLoading({ label = 'Dang tai du lieu...' }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      {label}
    </span>
  );
}
