export const PREDICTION_COLORS = { NORMAL: '#10b981', PNEUMONIA: '#b91a24' };
export const STATUS_COLORS = { CONFIRMED: '#10b981', SUSPECTED: '#d97706' };
export const TYPE_COLORS = { BACTERIAL: '#b91a24', VIRAL: '#f59e0b', COVID: '#7c3aed', NONE: '#64748b' };
export const ROLES = { admin: 'Quan tri vien', doctor: 'Bac si', technician: 'Ky thuat vien' };
export const PAGE_SIZE = 20;
export const MAX_FILE_SIZE_MB = 10;
export const WS_MAX_RETRIES = 5;
export const POLLING_INTERVAL = 3000;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const NAV_ITEMS = [
  { to: '/predict', label: 'Diagnosis', icon: 'biotech', roles: ['doctor', 'admin', 'technician'] },
  { to: '/batch', label: 'Batch', icon: 'layers', roles: ['doctor', 'admin', 'technician'] },
  { to: '/history', label: 'History', icon: 'history', roles: ['doctor', 'admin', 'technician'] },
  { to: '/stats', label: 'Stats', icon: 'insert_chart', roles: ['doctor', 'admin'] },
  { to: '/admin/users', label: 'Admin Management', icon: 'admin_panel_settings', roles: ['admin'] },
];
