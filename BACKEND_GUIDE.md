# Hướng Dẫn Code Backend – Hệ Thống Phát Hiện Viêm Phổi
## Nhóm G3 – Đề tài #16

---

## STACK CÔNG NGHỆ

```
FastAPI + Uvicorn    → REST API
MySQL + SQLAlchemy   → Database ORM
PyMySQL              → MySQL driver
Alembic              → Database migration
Celery + Redis       → Task queue
python-jose          → JWT
bcrypt               → Password hashing
PyTorch              → AI inference
Nginx                → Reverse proxy
Docker Compose       → Triển khai
```

---

## CẤU TRÚC THƯ MỤC

```
backend/
├── main.py                   # FastAPI app, khởi tạo, router
├── config.py                 # Settings từ .env
├── database/
│   ├── connection.py         # MySQL engine + session
│   ├── models.py             # SQLAlchemy ORM models
│   └── crud.py               # Query functions
├── auth/
│   ├── jwt.py                # Tạo/verify JWT
│   ├── password.py           # bcrypt hash/verify
│   └── dependencies.py       # get_current_user() dependency
├── api/
│   ├── auth.py               # /api/auth/*
│   ├── predict.py            # /api/predict/*
│   ├── history.py            # /api/history/*
│   ├── stats.py              # /api/stats/*
│   └── admin.py              # /api/admin/*
├── worker/
│   ├── celery_app.py         # Celery instance
│   ├── tasks.py              # Celery task definitions
│   └── websocket.py          # WebSocket manager
├── models/
│   ├── loader.py             # Load 4 AI model .pth
│   └── pipeline.py           # Full pipeline inference
├── utils/
│   ├── file.py               # Xử lý file upload
│   ├── pdf.py                # Xuất PDF kết quả
│   └── logging.py            # Logger setup
├── migrations/               # Alembic migration files
├── weights/                  # File .pth AI models
│   ├── lung_unet_best.pth
│   ├── densenet_t1_best.pth
│   ├── effnet_t1_best.pth
│   └── densenet_t2_best.pth
├── uploads/                  # File ảnh upload
├── .env                      # Biến môi trường
├── requirements.txt
├── Dockerfile
└── alembic.ini
```

---

## BIẾN MÔI TRƯỜNG (.env)

```env
# Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=pneumonia_db
MYSQL_USER=pneumonia_user
MYSQL_PASSWORD=your_password

# JWT
JWT_SECRET_KEY=your_random_32_char_secret
JWT_ALGORITHM=HS256
JWT_ACCESS_EXPIRE_HOURS=8
JWT_REFRESH_EXPIRE_DAYS=30

# Redis
REDIS_URL=redis://localhost:6379/0

# Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
FILE_RETENTION_HOURS=24

# CORS
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# Environment
ENVIRONMENT=development
DEBUG=true
```

---

## DATABASE MODELS (SQLAlchemy)

### Yêu cầu tạo 6 bảng theo thứ tự

#### Bảng `users`
```
id, username (UNIQUE), password_hash, full_name,
role (ENUM: admin/doctor/technician), department,
is_active (DEFAULT TRUE), failed_login_count (DEFAULT 0),
locked_until (NULLABLE), created_at, last_login (NULLABLE)
```

#### Bảng `refresh_tokens`
```
id, user_id (FK→users), token_hash, expires_at,
is_revoked (DEFAULT FALSE), created_at, revoked_at (NULLABLE)
```

#### Bảng `predictions`
```
id, user_id (FK→users), task_id (UUID, UNIQUE), filename, file_path,
prediction (ENUM: NORMAL/PNEUMONIA),
ensemble_status (ENUM: CONFIRMED/SUSPECTED),
confidence, prob_dn, prob_eff,
disease_type (ENUM: BACTERIAL/VIRAL/COVID/NONE),
bacterial_prob, viral_prob, covid_prob,
lesion_pct, bbox_x1, bbox_y1, bbox_x2, bbox_y2,
dice_score, heatmap_dn_path, heatmap_eff_path, lung_mask_path,
doctor_note (TEXT, NULLABLE), doctor_confirmed (BOOLEAN, NULLABLE),
status (ENUM: queued/processing/done/failed),
error_message (TEXT, NULLABLE), processing_time_ms,
created_at, completed_at (NULLABLE)
```

#### Bảng `batch_jobs`
```
id, user_id (FK→users), job_name, total,
completed (DEFAULT 0), failed (DEFAULT 0),
status (ENUM: queued/running/done/failed),
created_at, finished_at (NULLABLE)
```

#### Bảng `batch_items`
```
id, batch_id (FK→batch_jobs), prediction_id (FK→predictions, NULLABLE),
filename, status (ENUM: queued/processing/done/failed),
queue_position, error_message (NULLABLE)
```

#### Bảng `audit_logs`
```
id, user_id (FK→users, NULLABLE), action (VARCHAR 100),
target_type (VARCHAR 50), target_id (NULLABLE),
ip_address, user_agent, detail (JSON, NULLABLE), created_at
```

---

## API ENDPOINTS CẦN IMPLEMENT

### Auth – `/api/auth`

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| POST | `/login` | `{username, password}` | `{access_token, refresh_token, user}` |
| POST | `/logout` | `{refresh_token}` | `{message}` |
| POST | `/refresh` | `{refresh_token}` | `{access_token, refresh_token}` |
| GET | `/me` | – | `{id, username, full_name, role}` |
| PUT | `/me/password` | `{old_password, new_password}` | `{message}` |

### Predict – `/api/predict`

| Method | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/` | `multipart/form-data: file` | `{task_id, position}` |
| POST | `/batch` | `multipart/form-data: files[]` | `{batch_id, task_ids[]}` |
| GET | `/{task_id}` | – | `PredictionResult` |
| GET | `/batch/{batch_id}` | – | `{completed, total, items[]}` |
| PUT | `/{id}/note` | `{note}` | `{message}` |
| PUT | `/{id}/confirm` | `{confirmed: bool}` | `{message}` |
| GET | `/{id}/export` | – | PDF file |
| WS | `/ws/{task_id}` | – | WebSocket stream |

### History – `/api/history`

| Method | Path | Query Params | Response |
|--------|------|-------------|----------|
| GET | `/` | `page, limit, prediction, status, date_from, date_to` | `{items[], total, page}` |
| GET | `/{id}` | – | `PredictionResult` đầy đủ |

### Stats – `/api/stats`

| Method | Path | Quyền | Response |
|--------|------|-------|----------|
| GET | `/me` | Doctor | Thống kê cá nhân |
| GET | `/all` | Admin | Thống kê toàn hệ thống |
| GET | `/weekly` | Doctor, Admin | Số ca theo 7 ngày gần nhất |

### Admin – `/api/admin`

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/users` | `page, search, role, is_active` | `{items[], total}` |
| POST | `/users` | `{username, password, full_name, role, department}` | `User` |
| PUT | `/users/{id}` | `{full_name, role, department, is_active}` | `User` |
| PUT | `/users/{id}/unlock` | – | `{message}` |
| DELETE | `/users/{id}` | – | `{message}` |
| GET | `/history` | `page, user_id, date_from, date_to` | `{items[], total}` |
| GET | `/audit` | `page, action, user_id, date_from` | `{items[], total}` |

### Health – `/health`

| Method | Path | Response |
|--------|------|----------|
| GET | `/` | `{status, db, redis, models, queue_size}` |
| GET | `/models` | `{unet, densenet_t1, effnet_t1, densenet_t2}` |
| GET | `/queue` | `{pending, active, failed}` |
| GET | `/db` | `{connected, latency_ms}` |

---

## XÁC THỰC JWT

### Logic đăng nhập
1. Tìm user theo username trong DB
2. Kiểm tra `is_active = True`
3. Kiểm tra `locked_until` – nếu còn trong thời gian khóa → trả lỗi + thời gian chờ
4. Verify password với bcrypt
5. Nếu sai: tăng `failed_login_count`, nếu đạt 5 → set `locked_until = now + 30 phút`
6. Nếu đúng: reset `failed_login_count = 0`, cập nhật `last_login`
7. Tạo Access Token (payload: `sub=user_id, role, exp`)
8. Tạo Refresh Token (random UUID), lưu hash vào bảng `refresh_tokens`
9. Ghi audit log action=`login`

### Logic refresh token
1. Nhận refresh token từ request
2. Hash token, tìm trong DB
3. Kiểm tra `is_revoked = False` và `expires_at > now`
4. Thu hồi token cũ (`is_revoked = True`, set `revoked_at`)
5. Cấp Access Token mới + Refresh Token mới
6. Lưu Refresh Token mới vào DB

### Dependency `get_current_user`
- Đọc header `Authorization: Bearer <token>`
- Verify JWT bằng SECRET_KEY
- Lấy `user_id` từ payload
- Truy vấn DB lấy user object
- Return user – dùng trong mọi endpoint cần auth

---

## CELERY WORKER – PIPELINE AI

### Logic task chính
```
1. Nhận task: {prediction_id, file_path}
2. Cập nhật status = 'processing'
3. Notify WebSocket: T0 starting
4. T0: UNet crop phổi → lưu lung_mask
5. Notify WebSocket: T0 done, dice_score
6. T1: DenseNet(ảnh gốc) + EfficientNet(ảnh crop) song song
7. Notify WebSocket: T1 done, prob_dn, prob_eff
8. Tính Ensemble → CONFIRMED/SUSPECTED/NORMAL
9. T1.5: Grad-CAM → heatmap DenseNet + EfficientNet
     → cv2.boundingRect(GradCAM ∩ UNet mask) → bbox
10. Lưu heatmap_dn_path, heatmap_eff_path, lung_mask_path
11. Notify WebSocket: heatmap done
12. Nếu PNEUMONIA CONFIRMED:
    T2: DenseNet T2 → BACTERIAL/VIRAL/COVID
    Notify WebSocket: T2 done
13. Cập nhật predictions record đầy đủ, status = 'done'
14. Notify WebSocket: pipeline complete
15. Nếu là batch_item: cập nhật batch_jobs.completed += 1
```

### WebSocket message format
```json
{"stage": "T0", "status": "running", "message": "UNet đang crop phổi..."}
{"stage": "T0", "status": "done", "dice_score": 0.9674}
{"stage": "T1", "status": "done", "prob_dn": 0.94, "prob_eff": 0.89, "ensemble": "CONFIRMED"}
{"stage": "T1.5", "status": "done", "heatmap_ready": true}
{"stage": "T2", "status": "done", "disease_type": "BACTERIAL"}
{"stage": "final", "status": "done", "prediction_id": 123}
{"stage": "error", "status": "failed", "message": "Lỗi inference"}
```

### Model loading (chỉ 1 lần khi Worker khởi động)
```
1. Load 4 model .pth vào DEVICE (CUDA nếu có, else CPU)
2. Set tất cả model.eval()
3. Warm-up: chạy 1 ảnh dummy 224x224 qua toàn pipeline
4. Log thời gian load và VRAM usage
5. Chỉ sau warm-up xong mới đăng ký nhận task từ queue
```

---

## RATE LIMITING

Dùng Redis để đếm request:

| Endpoint | Giới hạn | Key Redis |
|----------|----------|-----------|
| POST /login | 10 req/phút/IP | `ratelimit:login:{ip}` |
| POST /predict | 20 req/phút/user | `ratelimit:predict:{user_id}` |
| POST /predict/batch | 5 req/phút/user | `ratelimit:batch:{user_id}` |
| Các endpoint khác | 100 req/phút/user | `ratelimit:api:{user_id}` |

Khi vượt giới hạn → HTTP 429, header `Retry-After: {seconds}`

---

## XỬ LÝ FILE

### Khi nhận file upload
1. Kiểm tra Content-Type phải là `image/jpeg` hoặc `image/png`
2. Kiểm tra magic bytes (4 byte đầu): JPEG=`FF D8 FF`, PNG=`89 50 4E 47`
3. Kiểm tra size ≤ MAX_FILE_SIZE_MB
4. Đổi tên thành `{uuid4()}.{ext}` để tránh conflict và traversal attack
5. Lưu vào `{UPLOAD_DIR}/{task_id}/original.{ext}`

### Cấu trúc thư mục cho mỗi task
```
uploads/
└── {task_id}/
    ├── original.jpg
    ├── cropped.jpg
    ├── heatmap_dn.jpg
    ├── heatmap_eff.jpg
    ├── lung_mask.jpg
    └── bbox_overlay.jpg
```

### Xóa ảnh gốc
- Celery Beat job chạy mỗi 1 giờ
- Tìm tất cả `original.jpg` có `created_at < now - 24h`
- Xóa file, không xóa kết quả và heatmap

---

## GLOBAL EXCEPTION HANDLER

Tất cả exception trả về JSON chuẩn:
```json
{
  "status_code": 422,
  "error_code": "VALIDATION_ERROR",
  "message": "File không đúng định dạng ảnh",
  "timestamp": "2026-03-15T14:32:00"
}
```

| Exception | Status Code | Error Code |
|-----------|-------------|------------|
| ValidationError | 422 | VALIDATION_ERROR |
| AuthenticationError | 401 | UNAUTHORIZED |
| PermissionError | 403 | FORBIDDEN |
| NotFoundError | 404 | NOT_FOUND |
| RateLimitError | 429 | RATE_LIMIT_EXCEEDED |
| InferenceError | 500 | INFERENCE_FAILED |
| DatabaseError | 500 | DATABASE_ERROR |

---

## LOGGING

4 loại logger riêng biệt:

| Logger | File | Ghi gì |
|--------|------|--------|
| request_logger | logs/request_YYYY-MM-DD.log | Method, endpoint, user_id, IP, status, thời gian |
| error_logger | logs/error_YYYY-MM-DD.log | Exception + stack trace đầy đủ |
| performance_logger | logs/perf_YYYY-MM-DD.log | Thời gian từng tầng AI |
| audit_logger | MySQL audit_logs table | Mọi hành động nhạy cảm |

Log rotation: max 100MB/file, giữ 30 ngày, nén file cũ.

---

## XUẤT PDF

Khi GET `/api/predict/{id}/export`:
1. Lấy prediction record từ DB
2. Dùng thư viện `reportlab` hoặc `weasyprint`
3. PDF gồm: header (tên bệnh viện, ngày), ảnh gốc, 2 heatmap, bảng kết quả, ghi chú bác sĩ, footer
4. Trả về response với `Content-Type: application/pdf`
5. Header `Content-Disposition: attachment; filename=XR-{id}.pdf`

---

## RESPONSE FORMAT CHUẨN

### PredictionResult (JSON đầy đủ)
```json
{
  "id": 1,
  "task_id": "uuid",
  "status": "done",
  "created_at": "2026-03-15T14:32:00",
  "completed_at": "2026-03-15T14:32:03",
  "processing_time_ms": 2840,
  "stage1": {
    "prediction": "PNEUMONIA",
    "ensemble_status": "CONFIRMED",
    "confidence": 0.915,
    "prob_dn": 0.94,
    "prob_eff": 0.89
  },
  "stage2": {
    "disease_type": "BACTERIAL",
    "bacterial_prob": 0.71,
    "viral_prob": 0.19,
    "covid_prob": 0.10
  },
  "visualization": {
    "heatmap_dn_url": "/static/{task_id}/heatmap_dn.jpg",
    "heatmap_eff_url": "/static/{task_id}/heatmap_eff.jpg",
    "lung_mask_url": "/static/{task_id}/lung_mask.jpg",
    "bbox": {"x1": 45, "y1": 80, "x2": 130, "y2": 160},
    "lesion_pct": 12.4
  },
  "doctor_note": null,
  "doctor_confirmed": null
}
```

---

## LƯU Ý QUAN TRỌNG

1. **Không** dùng `debug=True` trong production
2. **Không** để lộ stack trace trong response
3. **Không** lưu mật khẩu plain text, chỉ bcrypt hash
4. **Không** public thư mục uploads qua Nginx – phải qua API với auth
5. Model AI load **1 lần duy nhất** khi Worker khởi động, không reload mỗi request
6. Mọi DB query phải dùng **parameterized query** qua SQLAlchemy, không concat string
7. Task timeout **120 giây** – nếu quá thì đánh dấu FAILED
8. WebSocket phải xử lý disconnect gracefully, không crash Worker
