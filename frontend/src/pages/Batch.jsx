import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import BatchTable from '../components/batch/BatchTable';
import BatchUpload from '../components/batch/BatchUpload';
import QueueStatus from '../components/batch/QueueStatus';
import { getBatchApi, submitBatchApi } from '../api/predict';
import { useFileUpload } from '../hooks/useFileUpload';
import { useTaskStore } from '../stores/taskStore';
import { useAuthStore } from '../stores/authStore';

const GUEST_BATCH = {
  completed: 2,
  total: 5,
  items: [
    { id: 1, filename: 'XR-viral-preview-01.png', status: 'done', queue_position: 1, prediction_id: null },
    { id: 2, filename: 'XR-normal-preview-02.png', status: 'done', queue_position: 2, prediction_id: null },
    { id: 3, filename: 'XR-covid-preview-03.png', status: 'processing', queue_position: 3, prediction_id: null },
    { id: 4, filename: 'XR-bacterial-preview-04.png', status: 'queued', queue_position: 4, prediction_id: null },
    { id: 5, filename: 'XR-ward-preview-05.png', status: 'queued', queue_position: 5, prediction_id: null },
  ],
};

export default function Batch() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { files, previews, onSelectFiles } = useFileUpload({ multiple: true });
  const { activeBatchId, setActiveBatchId } = useTaskStore();
  const [batch, setBatch] = useState(null);

  const displayBatch = useMemo(() => (isAuthenticated ? batch : GUEST_BATCH), [batch, isAuthenticated]);
  const percent = displayBatch?.total ? Math.round((displayBatch.completed / displayBatch.total) * 100) : 0;

  const mutation = useMutation({
    mutationFn: submitBatchApi,
    onSuccess: (data) => { setActiveBatchId(data.batch_id); toast.success('Batch created successfully'); },
    onError: (error) => toast.error(error?.response?.data?.message ?? 'Could not create batch'),
  });

  useEffect(() => {
    if (!isAuthenticated || !activeBatchId) return undefined;
    const load = async () => { const data = await getBatchApi(activeBatchId); setBatch(data); };
    load();
    const timer = window.setInterval(load, 3000);
    return () => window.clearInterval(timer);
  }, [activeBatchId, isAuthenticated]);

  const handleStart = () => {
    if (!isAuthenticated) { toast('Sign in to process batches.', { icon: 'ℹ️' }); navigate('/login?next=/batch'); return; }
    mutation.mutate(files);
  };

  return (
    <div className="space-y-8">
      {/* Global Progress Bar */}
      {displayBatch ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-sm font-medium text-on-surface-variant">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-container" /> {displayBatch.items?.filter(i => i.status === 'processing').length || 0} Processing</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-outline" /> {displayBatch.items?.filter(i => i.status === 'queued').length || 0} Pending</span>
            </div>
            <span className="font-bold text-primary">Processing {displayBatch.completed}/{displayBatch.total} files...</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-surface-container-low">
            <div className="primary-gradient relative h-full rounded-full" style={{ width: `${percent}%` }}>
              <div className="absolute inset-0 animate-pulse bg-white/20" />
            </div>
          </div>
        </section>
      ) : null}

      {!isAuthenticated ? (
        <div className="glass-panel rounded-xl p-5 text-sm text-on-surface-variant">
          Guest mode showing a demo queue. Sign in to process real batches.
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
          <BatchUpload previews={previews} onFiles={onSelectFiles} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <QueueStatus batch={displayBatch} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="col-span-2 primary-gradient flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-white" disabled={(isAuthenticated && !files.length) || mutation.isPending} onClick={handleStart}>
          <span className="material-symbols-outlined">play_arrow</span>
          {mutation.isPending ? 'Processing...' : 'Start Analysis'}
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
          <span className="material-symbols-outlined text-sm">pause</span> Pause
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-tertiary transition-colors hover:bg-red-50">
          <span className="material-symbols-outlined text-sm">delete_sweep</span> Clear Queue
        </button>
      </div>

      {displayBatch ? <BatchTable items={displayBatch.items ?? []} /> : <EmptyState title="No batch yet" description="Upload multiple X-ray images to track processing queue." actionLabel="Go to Diagnosis" actionTo="/predict" />}
    </div>
  );
}
