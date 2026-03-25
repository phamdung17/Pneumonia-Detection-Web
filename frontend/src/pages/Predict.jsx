import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getPredictResultApi, submitPredictApi, updateConfirmApi, updateNoteApi } from '../api/predict';
import UploadZone from '../components/predict/UploadZone';
import ProgressPipeline from '../components/predict/ProgressPipeline';
import EnsembleResult from '../components/predict/EnsembleResult';
import HeatmapViewer from '../components/predict/HeatmapViewer';
import TypeClassifier from '../components/predict/TypeClassifier';
import DoctorNote from '../components/predict/DoctorNote';
import { useFileUpload } from '../hooks/useFileUpload';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTaskStore } from '../stores/taskStore';

function mapStageUpdate(stage, status, setStepState) {
  const normalizedStatus = status === 'running' ? 'processing' : status;

  if (stage === 'preprocess' || stage === 'T0') {
    setStepState((prev) => ({ ...prev, preprocessing: normalizedStatus === 'done' ? 'done' : 'processing', ensemble: normalizedStatus === 'done' ? 'processing' : prev.ensemble }));
    return;
  }
  if (stage === 'ensemble' || stage === 'T1') {
    setStepState((prev) => ({ ...prev, ensemble: normalizedStatus === 'done' ? 'done' : 'processing', heatmap: normalizedStatus === 'done' ? 'processing' : prev.heatmap }));
    return;
  }
  if (stage === 'heatmap' || stage === 'T1.5') {
    setStepState((prev) => ({ ...prev, heatmap: normalizedStatus === 'done' ? 'done' : 'processing', final: normalizedStatus === 'done' ? 'processing' : prev.final }));
    return;
  }
  if (stage === 'T2') {
    setStepState((prev) => ({ ...prev, final: normalizedStatus === 'done' ? 'processing' : prev.final }));
    return;
  }
  if (stage === 'final' && normalizedStatus === 'done') {
    setStepState({ preprocessing: 'done', ensemble: 'done', heatmap: 'done', final: 'done' });
    return;
  }
  if (stage === 'error' || normalizedStatus === 'failed') {
    setStepState((prev) => ({ ...prev, final: 'failed' }));
  }
}

export default function Predict() {
  const navigate = useNavigate();
  const { file, previews, onSelectFiles } = useFileUpload();
  const { user, isAuthenticated } = useAuthStore();
  const { activePredictTaskId, setActivePredictTaskId } = useTaskStore();
  const [result, setResult] = useState(null);
  const [stepState, setStepState] = useState({ preprocessing: 'queued', ensemble: 'queued', heatmap: 'queued', final: 'queued' });

  const steps = useMemo(
    () => [
      { key: 'preprocessing', label: 'Preprocessing Image', status: stepState.preprocessing },
      { key: 'ensemble', label: 'AI Ensemble Analysis', status: stepState.ensemble },
      { key: 'heatmap', label: 'Generating Heatmap', status: stepState.heatmap },
      { key: 'final', label: 'Finalizing Results', status: stepState.final },
    ],
    [stepState],
  );

  const progress = Math.round((steps.filter((item) => item.status === 'done').length / steps.length) * 100);

  const submitMutation = useMutation({
    mutationFn: submitPredictApi,
    onSuccess: (data) => {
      toast.success('Upload successful, AI is processing');
      setActivePredictTaskId(data.task_id);
      setResult(null);
      setStepState({ preprocessing: 'processing', ensemble: 'queued', heatmap: 'queued', final: 'queued' });
    },
    onError: (error) => toast.error(error?.response?.data?.message ?? 'Could not upload image'),
  });

  useWebSocket(activePredictTaskId, {
    onProgress: (stage, status) => { mapStageUpdate(stage, status, setStepState); },
    onComplete: async (_, payload) => {
      try {
        const taskId = payload?.task_id ?? activePredictTaskId;
        const response = await getPredictResultApi(taskId);
        setResult(response);
        setStepState({ preprocessing: 'done', ensemble: 'done', heatmap: 'done', final: 'done' });
        toast.success('Diagnosis results ready');
      } catch (error) {
        toast.error(error?.response?.data?.message ?? 'Could not retrieve results');
      }
    },
    onError: (message) => {
      setStepState((prev) => ({ ...prev, final: 'failed' }));
      toast.error(message);
    },
  });

  const doctorActions = {
    onSave: async (note) => {
      if (!result?.id) return;
      await updateNoteApi(result.id, note);
      toast.success('Note saved');
      setResult((prev) => ({ ...prev, doctor_note: note }));
    },
    onConfirm: async (confirmed) => {
      if (!result?.id) return;
      await updateConfirmApi(result.id, confirmed);
      toast.success('Confirmation updated');
      setResult((prev) => ({ ...prev, doctor_confirmed: confirmed }));
    },
  };

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast('Please sign in to start analysis.', { icon: 'ℹ️' });
      navigate('/login?next=/predict');
      return;
    }
    submitMutation.mutate(file);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload & Pipeline Column */}
        <div className="lg:col-span-5 space-y-8">
          {!isAuthenticated ? (
            <div className="glass-panel rounded-xl p-5 text-sm text-on-surface-variant">
              You are in guest mode. Upload and save features require sign-in.
            </div>
          ) : null}
          <UploadZone previews={previews} onFiles={onSelectFiles} />
          <button className="btn-primary w-full" disabled={!file || submitMutation.isPending} onClick={handleSubmit}>
            {submitMutation.isPending ? 'Analyzing...' : isAuthenticated ? 'Analyze Image' : 'Sign in to Analyze'}
          </button>
          <ProgressPipeline steps={steps} progress={progress} />
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-8">
          <EnsembleResult result={result} />
          <HeatmapViewer result={result} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TypeClassifier result={result} />
            <DoctorNote note={result?.doctor_note} canEdit={user?.role === 'doctor'} onSave={doctorActions.onSave} onConfirm={doctorActions.onConfirm} />
          </div>
        </div>
      </div>

      {/* FAB Print Button */}
      <div className="fixed bottom-8 right-8">
        <button className="flex h-14 w-14 items-center justify-center rounded-full primary-gradient text-white shadow-xl transition-transform hover:scale-110">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>print</span>
        </button>
      </div>
    </>
  );
}
