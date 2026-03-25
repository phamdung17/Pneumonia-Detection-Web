import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { exportPredictionApi, updateConfirmApi, updateNoteApi } from '../api/predict';
import { getHistoryDetailApi } from '../api/history';
import EnsembleResult from '../components/predict/EnsembleResult';
import HeatmapViewer from '../components/predict/HeatmapViewer';
import TypeClassifier from '../components/predict/TypeClassifier';
import DoctorNote from '../components/predict/DoctorNote';
import { useAuthStore } from '../stores/authStore';

export default function HistoryDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data, refetch } = useQuery({
    queryKey: ['history-detail', id],
    queryFn: () => getHistoryDetailApi(id),
  });

  const saveNote = async (note) => {
    await updateNoteApi(data.id, note);
    toast.success('Da luu ghi chu');
    refetch();
  };

  const confirm = async (confirmed) => {
    await updateConfirmApi(data.id, confirmed);
    toast.success('Da cap nhat xac nhan');
    refetch();
  };

  const exportPdf = async () => {
    const blob = await exportPredictionApi(data.id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ket-qua-XQ-${data.id}-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button className="btn-secondary" onClick={exportPdf}><Download className="h-4 w-4" /> Xuat PDF</button>
      </div>
      <EnsembleResult result={data} />
      <HeatmapViewer result={data} />
      <div className="grid gap-8 lg:grid-cols-2">
        <TypeClassifier result={data} />
        <DoctorNote note={data.doctor_note} canEdit={user?.role === 'doctor'} onSave={saveNote} onConfirm={confirm} />
      </div>
    </div>
  );
}
