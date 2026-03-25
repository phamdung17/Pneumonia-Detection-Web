import { PREDICTION_COLORS, ROLES, STATUS_COLORS, TYPE_COLORS } from './constants';

export function formatDate(value) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  return `${Number(value).toFixed(digits)}%`;
}

export function formatConfidence(value) {
  if (value === null || value === undefined) return '--';
  return formatPercent(Number(value) * 100, 1);
}

export function getPredictionColor(prediction) {
  return PREDICTION_COLORS[prediction] ?? '#64748b';
}

export function getStatusColor(status) {
  return STATUS_COLORS[status] ?? '#64748b';
}

export function getTypeColor(type) {
  return TYPE_COLORS[type] ?? '#64748b';
}

export function getPredictionLabel(prediction) {
  return prediction === 'PNEUMONIA' ? 'Viem phoi' : prediction === 'NORMAL' ? 'Binh thuong' : '--';
}

export function getTypeLabel(type) {
  if (type === 'BACTERIAL') return 'Vi khuan';
  if (type === 'VIRAL') return 'Virus';
  if (type === 'COVID') return 'COVID-19';
  return '--';
}

export function getRoleLabel(role) {
  return ROLES[role] ?? role;
}

export function getInitials(name) {
  return (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
