import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatPercent } from '../../utils/formatters';

function AssetImage({ src, title, label, boxStyle }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let objectUrl = null;

    const loadImage = async () => {
      if (!src) { setImageUrl(null); return; }
      setLoading(true);
      try {
        const response = await api.get(src, { responseType: 'blob' });
        objectUrl = URL.createObjectURL(response.data);
        setImageUrl(objectUrl);
      } catch {
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src]);

  const placeholder = (text) => (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center text-sm text-white/70">
      {text}
      {/* Label overlay even on placeholder */}
      <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-bold uppercase tracking-widest">
        {label}
      </div>
    </div>
  );

  if (!src) return placeholder(`Chưa có ${title}`);
  if (loading) return placeholder(`Đang tải ${title}...`);
  if (!imageUrl) return placeholder(`Không tải được ${title}`);

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
      {/* X-ray / Heatmap image */}
      <img className="w-full h-full object-cover opacity-80" src={imageUrl} alt={title} />

      {/* Bottom-left label overlay */}
      <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-bold uppercase tracking-widest">
        {label}
      </div>

      {/* Bounding box overlay */}
      {boxStyle && (
        <div
          className="absolute rounded-sm"
          style={boxStyle}
        />
      )}
    </div>
  );
}

export default function HeatmapViewer({ result }) {
  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Header row: title + action buttons */}
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-lg font-bold">Localization Heatmaps</h3>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg bg-surface-container-high text-primary">
            <span className="material-symbols-outlined">zoom_in</span>
          </button>
          <button className="p-2 rounded-lg bg-surface-container-high text-primary">
            <span className="material-symbols-outlined">layers</span>
          </button>
        </div>
      </div>

      {/* 2-column heatmap grid */}
      <div className="grid grid-cols-2 gap-4">
        <AssetImage
          src={result.visualization?.heatmap_dn_url}
          title="heatmap DenseNet"
          label="DenseNet Activation"
          boxStyle={{
            top: '25%',
            left: '25%',
            width: '50%',
            height: '33%',
            border: '2px solid #ff6c66',
            boxShadow: '0 0 15px rgba(185, 26, 36, 0.5)',
          }}
        />
        <AssetImage
          src={result.visualization?.heatmap_eff_url}
          title="heatmap EfficientNet"
          label="EfficientNet Grad-CAM"
          boxStyle={{
            top: '33%',
            right: '25%',
            width: '33%',
            height: '50%',
            border: '2px solid #0ea5e9',
            boxShadow: '0 0 15px rgba(14, 165, 233, 0.5)',
          }}
        />
      </div>

      {/* Lesion percentage info bar */}
      {result.visualization?.lesion_pct != null && (
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-4">
          <span className="material-symbols-outlined text-primary">radiology</span>
          <p className="text-sm text-on-surface-variant">
            Estimated lesion area: <span className="font-semibold text-on-surface">{formatPercent(result.visualization.lesion_pct)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
