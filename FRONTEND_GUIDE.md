# Hướng Dẫn Code Frontend – Hệ Thống Phát Hiện Viêm Phổi
## Nhóm G3 – Đề tài #16

---

## STACK CÔNG NGHỆ

```
React 18 + Vite        → Framework + Build tool
React Router v6        → Client-side routing
Axios                  → HTTP client
Zustand                → State management
React Query            → Server state + caching
Tailwind CSS           → Styling
React Hot Toast        → Toast notification
jsPDF + html2canvas   → Xuất PDF phía client
Recharts               → Biểu đồ thống kê
```

---

## CẤU TRÚC THƯ MỤC

```
frontend/
├── public/
├── src/
│   ├── main.jsx                  # Entry point
│   ├── App.jsx                   # Router setup
│   ├── api/
│   │   ├── axios.js              # Axios instance + interceptors
│   │   ├── auth.js               # Auth API calls
│   │   ├── predict.js            # Predict API calls
│   │   ├── history.js            # History API calls
│   │   ├── stats.js              # Stats API calls
│   │   └── admin.js              # Admin API calls
│   ├── stores/
│   │   ├── authStore.js          # Zustand: user, token
│   │   └── taskStore.js          # Zustand: active tasks
│   ├── hooks/
│   │   ├── useAuth.js            # Auth logic
│   │   ├── useWebSocket.js       # WebSocket + reconnect
│   │   └── useFileUpload.js      # Upload + validation
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   │   ├── Layout.jsx        # Wrapper có sidebar
│   │   │   └── PrivateRoute.jsx  # Bảo vệ route
│   │   ├── common/
│   │   │   ├── Toast.jsx         # Toast notification
│   │   │   ├── Loading.jsx       # Skeleton loading
│   │   │   ├── EmptyState.jsx    # Khi không có dữ liệu
│   │   │   ├── Badge.jsx         # Status badge
│   │   │   ├── Pagination.jsx    # Phân trang
│   │   │   └── ConfirmDialog.jsx # Hộp thoại xác nhận
│   │   ├── predict/
│   │   │   ├── UploadZone.jsx    # Kéo thả upload
│   │   │   ├── ProgressPipeline.jsx  # Thanh tiến độ pipeline
│   │   │   ├── EnsembleResult.jsx    # Kết quả Ensemble
│   │   │   ├── HeatmapViewer.jsx     # 2 Grad-CAM + bbox
│   │   │   ├── TypeClassifier.jsx    # Biểu đồ loại bệnh
│   │   │   └── DoctorNote.jsx        # Ghi chú bác sĩ
│   │   ├── batch/
│   │   │   ├── BatchUpload.jsx   # Upload nhiều file
│   │   │   ├── QueueStatus.jsx   # Tiến độ queue
│   │   │   └── BatchTable.jsx    # Bảng danh sách item
│   │   ├── history/
│   │   │   ├── FilterBar.jsx     # Bộ lọc lịch sử
│   │   │   └── HistoryTable.jsx  # Bảng lịch sử
│   │   ├── stats/
│   │   │   ├── KpiCards.jsx      # 4 card số liệu
│   │   │   ├── TypeChart.jsx     # Biểu đồ loại bệnh
│   │   │   ├── EnsembleChart.jsx # CONFIRMED vs SUSPECTED
│   │   │   └── WeeklyChart.jsx   # Biểu đồ theo tuần
│   │   └── admin/
│   │       ├── UserTable.jsx     # Bảng danh sách user
│   │       └── UserForm.jsx      # Form tạo/sửa user
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Predict.jsx
│   │   ├── Batch.jsx
│   │   ├── History.jsx
│   │   ├── HistoryDetail.jsx
│   │   ├── Stats.jsx
│   │   ├── Profile.jsx
│   │   ├── admin/
│   │   │   ├── Users.jsx
│   │   │   └── Audit.jsx
│   │   ├── NotFound.jsx          # 404
│   │   └── Forbidden.jsx         # 403
│   └── utils/
│       ├── constants.js          # Màu sắc, enum labels
│       ├── formatters.js         # Format ngày, số %
│       └── validators.js         # Validate file upload
├── .env.development
├── .env.production
├── tailwind.config.js
└── vite.config.js
```

---

## BIẾN MÔI TRƯỜNG

```env
# .env.development
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# .env.production
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

---

## AXIOS SETUP

### `src/api/axios.js` – yêu cầu cấu hình đầy đủ

**Request interceptor:**
- Đọc `access_token` từ localStorage
- Đính kèm vào header `Authorization: Bearer {token}`

**Response interceptor:**
- Nếu response 401 và có `refresh_token` trong localStorage:
  1. Gọi `POST /api/auth/refresh` với refresh token hiện tại
  2. Lưu access token mới vào localStorage
  3. Retry request gốc với token mới
  4. Nếu refresh cũng 401 → xóa token, redirect `/login`
- Nếu 429 → hiện toast "Quá nhiều request, vui lòng chờ {Retry-After} giây"
- Nếu 500 → hiện toast "Lỗi server, vui lòng thử lại"

---

## ROUTER SETUP (App.jsx)

```
/ → redirect → /predict

/login → <Login>  (public, redirect về /predict nếu đã đăng nhập)

/predict       → <PrivateRoute> → <Layout> → <Predict>
/batch         → <PrivateRoute> → <Layout> → <Batch>
/history       → <PrivateRoute> → <Layout> → <History>
/history/:id   → <PrivateRoute> → <Layout> → <HistoryDetail>
/stats         → <PrivateRoute roles={['admin','doctor']}> → <Stats>
/profile       → <PrivateRoute> → <Layout> → <Profile>
/admin/users   → <PrivateRoute roles={['admin']}> → <Layout> → <Users>
/admin/audit   → <PrivateRoute roles={['admin']}> → <Layout> → <Audit>

* → <NotFound>
```

---

## PRIVATEROUTE COMPONENT

Logic bảo vệ route:
1. Đọc user từ Zustand authStore
2. Nếu không có user → redirect `/login?next={currentPath}`
3. Nếu có `roles` prop và user.role không trong danh sách → render `<Forbidden />`
4. Nếu hợp lệ → render children

---

## AUTH STORE (Zustand)

```javascript
// State
user: null | { id, username, full_name, role, department }
isAuthenticated: boolean

// Actions
login(credentials)     → gọi API, lưu token localStorage, set user
logout()               → gọi API thu hồi token, xóa localStorage, clear user
refreshToken()         → gọi API refresh, cập nhật access_token
loadUser()             → gọi GET /api/auth/me khi app khởi động
```

Khi app khởi động (`main.jsx`): gọi `loadUser()` để khôi phục session nếu còn token hợp lệ.

---

## WEBSOCKET HOOK

### `useWebSocket(taskId)`

**Kết nối:**
```
ws://{WS_URL}/ws/{taskId}
```

**Logic reconnect:**
1. Khi `onclose` hoặc `onerror` được gọi
2. Thử kết nối lại tối đa 5 lần
3. Delay tăng dần: 1s, 2s, 4s, 8s, 16s
4. Sau 5 lần thất bại → bật polling fallback
5. Polling fallback: GET `/api/predict/{taskId}` mỗi 3 giây cho đến khi status = done/failed

**Message handling:**
```javascript
// Nhận JSON message, parse và gọi callback:
onProgress(stage, status, data)
onComplete(predictionId)
onError(message)
```

**Cleanup:** Đóng WebSocket khi component unmount hoặc khi nhận stage=final.

---

## UPLOAD VALIDATION (Client-side)

Kiểm tra trước khi gửi lên server:
1. Chỉ chấp nhận `image/jpeg`, `image/jpg`, `image/png`
2. Size ≤ 10MB
3. Đọc 4 byte đầu để kiểm tra magic bytes:
   - JPEG: `FF D8 FF`
   - PNG: `89 50 4E 47`
4. Nếu không hợp lệ → toast error, không gửi request

---

## CÁC TRANG CHI TIẾT

### Trang Login (`/login`)
- Form: username, password, remember me checkbox
- Validate: không để trống trước khi submit
- Khi đăng nhập thành công: redirect về `?next=` hoặc `/predict`
- Khi sai thông tin: hiện lỗi dưới form
- Khi bị khóa: hiện countdown timer thời gian còn lại
- Không cho phép vào trang này khi đã đăng nhập

### Trang Chẩn Đoán (`/predict`)

**Luồng:**
1. Hiển thị `<UploadZone>` – kéo thả hoặc click
2. Khi chọn file: validate → preview ảnh
3. Click Phân tích: POST `/api/predict` → nhận `task_id`
4. Mở WebSocket theo `task_id`
5. `<ProgressPipeline>` cập nhật realtime theo WebSocket messages
6. Khi nhận `final done`: fetch GET `/api/predict/{taskId}` → hiển thị kết quả

**Hiển thị kết quả:**
- `<EnsembleResult>`: badge NORMAL/PNEUMONIA + CONFIRMED/SUSPECTED + confidence + prob từng model + progress bar
- `<HeatmapViewer>`: 2 ảnh heatmap DenseNet và EfficientNet cạnh nhau, overlay bounding box đỏ trên ảnh gốc, hiển thị lesion_pct
- `<TypeClassifier>`: 3 thanh bar BACTERIAL/VIRAL/COVID (chỉ hiện khi PNEUMONIA CONFIRMED)
- `<DoctorNote>`: textarea + nút Lưu + nút Xác nhận/Không đồng ý (chỉ role doctor)

### Trang Hàng Loạt (`/batch`)

**Luồng:**
1. Upload nhiều file cùng lúc
2. POST `/api/predict/batch` → nhận `batch_id`
3. `<QueueStatus>`: progress bar tổng (completed/total), WebSocket polling batch status
4. `<BatchTable>`: bảng file với cột trạng thái cập nhật realtime
5. Khi item done: hiện nút "Xem chi tiết" → navigate đến `/history/:id`

### Trang Lịch Sử (`/history`)

**Filter:**
- Dropdown: Tất cả / PNEUMONIA / NORMAL
- Dropdown: Tất cả / CONFIRMED / SUSPECTED
- Date range picker: từ ngày - đến ngày
- Nút Reset filter

**Bảng:**
- Cột: Mã ca, Thời gian, Dự đoán, Loại bệnh, Trạng thái, Độ tin cậy, Actions
- Nút "Chi tiết" → navigate `/history/:id`
- Phân trang: 20 item/trang

### Trang Chi Tiết Ca (`/history/:id`)

- Hiển thị đầy đủ như trang Chẩn đoán nhưng readonly
- Bổ sung: form ghi chú bác sĩ (nếu role doctor)
- Nút Xác nhận / Không đồng ý với kết quả AI
- Nút Xuất PDF
- Breadcrumb: Lịch sử > Mã ca

### Trang Thống Kê (`/stats`)

**4 KPI Cards:**
- Tổng ca chẩn đoán
- Số ca viêm phổi (+ %)
- Số ca bình thường (+ %)
- Độ tin cậy trung bình

**Biểu đồ (dùng Recharts):**
- Pie chart: BACTERIAL / VIRAL / COVID
- Bar chart ngang: CONFIRMED vs SUSPECTED
- Bar chart dọc: số ca theo 7 ngày trong tuần

### Trang Hồ Sơ (`/profile`)

- Hiển thị: họ tên, username, role, khoa phòng, ngày tạo, lần đăng nhập cuối
- Form đổi mật khẩu: mật khẩu cũ, mới, nhập lại mới
- Validate mật khẩu mới: ≥ 8 ký tự, có chữ hoa/thường/số/ký tự đặc biệt
- Thống kê cá nhân nhỏ: tổng ca, CONFIRMED, SUSPECTED

### Trang Quản Trị Users (`/admin/users`) – Chỉ Admin

- Thanh search tìm theo tên hoặc username
- Filter theo role, filter theo is_active
- Bảng: username, họ tên, role, khoa, ngày tạo, trạng thái, Actions
- Nút Thêm user → mở modal form
- Nút Sửa → mở modal form điền sẵn thông tin
- Nút Khóa/Mở khóa → confirm dialog trước khi thực hiện

---

## SIDEBAR NAVIGATION

Hiển thị menu theo role:

| Menu | Doctor | Admin | Technician |
|------|--------|-------|------------|
| Chẩn đoán | ✅ | ✅ | ✅ |
| Hàng loạt | ✅ | ✅ | ✅ |
| Lịch sử | ✅ | ✅ | ✅ |
| Thống kê | ✅ | ✅ | ❌ |
| Quản trị | ❌ | ✅ | ❌ |

Sidebar hiển thị: avatar + tên user + role badge ở dưới cùng.

---

## TOAST NOTIFICATION

Dùng `react-hot-toast` với 4 loại:

| Loại | Khi nào |
|------|---------|
| success | Upload thành công, lưu ghi chú thành công |
| error | Lỗi API, file sai format, quá size |
| warning | Token sắp hết hạn, WebSocket mất kết nối |
| loading | Đang đợi kết quả (auto dismiss khi xong) |

- Toast success và info: tự đóng sau 4 giây
- Toast error: yêu cầu user click đóng

---

## LOADING VÀ EMPTY STATE

### Skeleton Loading
Khi đang fetch data, hiển thị skeleton đúng hình dạng nội dung:
- Bảng lịch sử: skeleton các hàng với độ rộng khác nhau
- Trang chi tiết: skeleton heatmap hình chữ nhật + skeleton text
- KPI cards: skeleton 4 hình chữ nhật

### Empty State
Khi danh sách trống:
- Icon minh họa phù hợp (ảnh X-quang, lịch sử,...)
- Tiêu đề mô tả tình trạng
- Nút hành động (Upload ảnh đầu tiên, Quay lại...)

### Offline Banner
Khi `navigator.onLine = false`: hiện banner đỏ ở đầu trang "Mất kết nối mạng – một số tính năng không khả dụng".

---

## XUẤT PDF

Khi click nút Xuất PDF:
1. Gọi GET `/api/predict/{id}/export`
2. Server trả về file PDF
3. Tạo blob URL và trigger download tự động
4. Tên file: `Ket-qua-XQ-{id}-{date}.pdf`

---

## FORMAT TIỆN ÍCH

### `formatters.js`
```javascript
formatDate(isoString)       → "15/03/2026 14:32"
formatPercent(float)        → "91.5%"
formatConfidence(float)     → "91.5%" (từ 0.915)
getPredictionColor(pred)    → màu hex theo NORMAL/PNEUMONIA
getStatusColor(status)      → màu hex theo CONFIRMED/SUSPECTED
getTypeColor(type)          → màu hex theo BACTERIAL/VIRAL/COVID
getPredictionLabel(pred)    → "Bình thường" / "Viêm phổi"
getTypeLabel(type)          → "Vi khuẩn" / "Virus" / "COVID-19"
```

### `constants.js`
```javascript
PREDICTION_COLORS = { NORMAL: "#10b981", PNEUMONIA: "#ef4444" }
STATUS_COLORS     = { CONFIRMED: "#10b981", SUSPECTED: "#f59e0b" }
TYPE_COLORS       = { BACTERIAL: "#ef4444", VIRAL: "#f59e0b", COVID: "#8b5cf6" }
ROLES             = { admin: "Quản trị viên", doctor: "Bác sĩ", technician: "Kỹ thuật viên" }
PAGE_SIZE         = 20
MAX_FILE_SIZE_MB  = 10
WS_MAX_RETRIES    = 5
POLLING_INTERVAL  = 3000
```

---

## LƯU Ý QUAN TRỌNG

1. **Không** hardcode API URL – luôn dùng `import.meta.env.VITE_API_URL`
2. **Không** lưu mật khẩu hoặc thông tin nhạy cảm vào localStorage
3. Access token lưu localStorage, refresh token lưu localStorage (không dùng cookie vì không có backend set-cookie)
4. Mọi request cần auth phải đi qua axios instance đã cấu hình interceptor
5. WebSocket **phải** cleanup khi component unmount để tránh memory leak
6. Hình ảnh heatmap load từ API server (có auth), không public URL
7. Form submit phải disable nút trong lúc loading để tránh double submit
8. Sau khi token refresh thành công, **retry đúng 1 lần** request gốc, không retry vô hạn
9. Trang `/admin/*` phải kiểm tra role ở cả router lẫn backend – không chỉ ẩn menu
10. Responsive tối thiểu cho tablet (768px) – sidebar thu gọn thành icon
