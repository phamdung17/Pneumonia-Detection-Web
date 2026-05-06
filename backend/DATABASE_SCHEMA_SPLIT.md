# Cấu Trúc Bảng SQL - Phương Án Tách Bảng

Tài liệu này mô tả cấu trúc bảng SQL sau khi áp dụng phương án tách bảng để quản lý dữ liệu chi tiết hơn.

## 📋 Nội dung

- [Phương Án 1: Tách Bảng Predictions](#phương-án-1-tách-bảng-predictions)
- [Phương Án 2: Tách Bảng Users](#phương-án-2-tách-bảng-users)
- [Mối Quan Hệ Giữa Các Bảng](#mối-quan-hệ-giữa-các-bảng)
- [Hướng Dẫn Chạy Migration](#hướng-dẫn-chạy-migration)

---

## Phương Án 1: Tách Bảng Predictions

### 1. **predictions** (Bảng chính dự đoán)

Giữ lại thông tin core của dự đoán.

| Thuộc tính | Kiểu dữ liệu | Ghi chú |
|-----------|-------------|---------|
| id | INTEGER | Primary Key |
| user_id | INTEGER | Foreign Key → users.id, Indexed |
| task_id | STRING(36) | Unique, Indexed |
| filename | STRING(255) | Tên file xác định được |
| file_path | STRING(500) | Đường dẫn lưu trữ file |
| status | ENUM | queued, processing, done, failed |
| created_at | DATETIME | Auto-generated |

---

### 2. **prediction_patient_info** (Thông tin bệnh nhân)

Lưu trữ thông tin chi tiết về bệnh nhân.

| Thuộc tính | Kiểu dữ liệu | Ghi chú |
|-----------|-------------|---------|
| id | INTEGER | Primary Key |
| prediction_id | INTEGER | Foreign Key → predictions.id, Unique |
| patient_name | STRING(255) | Tên bệnh nhân |
| patient_age | INTEGER | Tuổi bệnh nhân |
| patient_gender | STRING(32) | Giới tính (nam/nữ) |
| technician_name | STRING(255) | Người làm xét nghiệm |
| performed_at | DATETIME | Thời gian chụp |
| created_at | DATETIME | Auto-generated |

**Tại sao tách riêng?**
- Tái sử dụng thông tin bệnh nhân (một bệnh nhân có thể có nhiều dự đoán)
- Dễ cập nhật thông tin bệnh nhân mà không ảnh hưởng đến dữ liệu dự đoán

---

### 3. **prediction_results** (Kết quả dự đoán)

Lưu trữ kết quả phân loại từ AI models.

| Thuộc tính | Kiểu dữ liệu | Ghi chú |
|-----------|-------------|---------|
| id | INTEGER | Primary Key |
| prediction_id | INTEGER | Foreign Key → predictions.id, Unique |
| prediction | ENUM | NORMAL, PNEUMONIA |
| ensemble_status | ENUM | CONFIRMED, SUSPECTED |
| confidence | FLOAT | Độ tin cậy (0-1) |
| prob_dn | FLOAT | Xác suất bình thường |
| prob_eff | FLOAT | Xác suất viêm |
| disease_type | ENUM | BACTERIAL, VIRAL, COVID, NONE |
| bacterial_prob | FLOAT | Xác suất nhiễm khuẩn |
| viral_prob | FLOAT | Xác suất virus |
| covid_prob | FLOAT | Xác suất COVID |
| created_at | DATETIME | Auto-generated |

**Tại sao tách riêng?**
- Tập trung vào kết quả dự đoán
- Dễ truy vấn các thống kê liên quan đến độ chính xác
- Có thể so sánh kết quả từ nhiều models khác nhau

---

### 4. **prediction_analysis** (Phân tích hình ảnh)

Lưu trữ dữ liệu phân tích hình ảnh (bounding box, mask, heatmap).

| Thuộc tính | Kiểu dữ liệu | Ghi chú |
|-----------|-------------|---------|
| id | INTEGER | Primary Key |
| prediction_id | INTEGER | Foreign Key → predictions.id, Unique |
| lesion_pct | FLOAT | Phần trăm vùng bệnh |
| bbox_x1 | INTEGER | Tọa độ X góc trái trên |
| bbox_y1 | INTEGER | Tọa độ Y góc trái trên |
| bbox_x2 | INTEGER | Tọa độ X góc phải dưới |
| bbox_y2 | INTEGER | Tọa độ Y góc phải dưới |
| dice_score | FLOAT | Chỉ số Dice |
| heatmap_dn_path | STRING(500) | Đường dẫn heatmap bình thường |
| heatmap_eff_path | STRING(500) | Đường dẫn heatmap viêm |
| lung_mask_path | STRING(500) | Đường dẫn mask phổi |
| created_at | DATETIME | Auto-generated |

**Tại sao tách riêng?**
- Dữ liệu nhạy cảm về không gian
- Dễ quản lý đường dẫn file hình ảnh
- Có thể xóa file mà không mất thông tin dự đoán khác

---

### 5. **prediction_doctor_review** (Xét duyệt bác sĩ)

Lưu trữ nhận xét và xác nhận của bác sĩ.

| Thuộc tính | Kiểu dữ liệu | Ghi chú |
|-----------|-------------|---------|
| id | INTEGER | Primary Key |
| prediction_id | INTEGER | Foreign Key → predictions.id, Unique |
| doctor_note | TEXT | Ghi chú của bác sĩ |
| doctor_confirmed | BOOLEAN | Đã xác nhận hay chưa |
| reviewed_at | DATETIME | Thời gian xét duyệt |
| created_at | DATETIME | Auto-generated |

**Tại sao tách riêng?**
- Phân quyền: Chỉ bác sĩ có thể chỉnh sửa
- Lịch sử: Lưu trữ khi nào dự đoán được xác nhận
- Tái sử dụng: Bác sĩ không cần tải toàn bộ dữ liệu để xem nhận xét

---

### 6. **prediction_processing_log** (Nhật ký xử lý)

Lưu trữ thông tin xử lý và lỗi.

| Thuộc tính | Kiểu dữ liệu | Ghi chú |
|-----------|-------------|---------|
| id | INTEGER | Primary Key |
| prediction_id | INTEGER | Foreign Key → predictions.id, Unique |
| error_message | TEXT | Thông báo lỗi (nếu có) |
| processing_time_ms | INTEGER | Thời gian xử lý (ms) |
| completed_at | DATETIME | Thời gian hoàn thành |
| created_at | DATETIME | Auto-generated |

**Tại sao tách riêng?**
- Debug: Dễ theo dõi các lỗi
- Hiệu suất: Phân tích thời gian xử lý
- Độc lập: Dữ liệu này không cần cho dự đoán chính

---

## Phương Án 2: Tách Bảng Users

### 1. **users** (Bảng xác thực)

Giữ lại thông tin đăng nhập và quyền hạn.

| Thuộc tính | Kiểu dữ liệu | Ghi chú |
|-----------|-------------|---------|
| id | INTEGER | Primary Key |
| username | STRING(100) | Unique, Indexed |
| password_hash | STRING(255) | Hash password |
| role | ENUM | admin, client |
| is_active | BOOLEAN | Tài khoản có hoạt động |
| created_at | DATETIME | Auto-generated |

**Thay đổi:**
- ✂️ Loại bỏ: full_name, email, phone, avatar_url
- ✂️ Loại bỏ: failed_login_count, locked_until, last_login

---

### 2. **user_profiles** (Thông tin cá nhân)

Lưu trữ thông tin cá nhân người dùng.

| Thuộc tính | Kiểu dữ liệu | Ghi chú |
|-----------|-------------|---------|
| id | INTEGER | Primary Key |
| user_id | INTEGER | Foreign Key → users.id, Unique |
| full_name | STRING(255) | Tên đầy đủ |
| email | STRING(255) | Email, Indexed |
| phone | STRING(20) | Số điện thoại, Indexed |
| avatar_url | STRING(500) | URL ảnh đại diện |
| created_at | DATETIME | Auto-generated |

**Tại sao tách riêng?**
- Cập nhật: Thay đổi thông tin cá nhân mà không ảnh hưởng xác thực
- Bảo mật: Riêng biệt dữ liệu nhạy cảm authentication
- Hiệu suất: Query xác thực không cần load toàn bộ profile

---

### 3. **user_security_logs** (Ghi nhận bảo mật)

Lưu trữ lịch sử đăng nhập và khóa tài khoản.

| Thuộc tính | Kiểu dữ liệu | Ghi chú |
|-----------|-------------|---------|
| id | INTEGER | Primary Key |
| user_id | INTEGER | Foreign Key → users.id, Unique |
| failed_login_count | INTEGER | Số lần đăng nhập thất bại |
| locked_until | DATETIME | Thời gian khóa tài khoản |
| last_login | DATETIME | Lần đăng nhập cuối cùng |
| created_at | DATETIME | Auto-generated |

**Tại sao tách riêng?**
- Bảo mật: Riêng biệt logic khóa tài khoản
- Hiệu suất: Cập nhật security log không ảnh hưởng auth
- Giám sát: Dễ theo dõi hoạt động bảo mật

---

## Mối Quan Hệ Giữa Các Bảng

```
users (1) ──┬─→ (∞) user_profiles
            │
            ├─→ (∞) user_security_logs
            │
            ├─→ (∞) refresh_tokens
            │
            ├─→ (∞) predictions (1) ──┬─→ (1) prediction_patient_info
            │                         │
            │                         ├─→ (1) prediction_results
            │                         │
            │                         ├─→ (1) prediction_analysis
            │                         │
            │                         ├─→ (1) prediction_doctor_review
            │                         │
            │                         └─→ (1) prediction_processing_log
            │
            └─→ (∞) audit_logs
```

---

## Hướng Dẫn Chạy Migration

### 1. **Kiểm tra migration hiện tại**

```bash
# Xem các migration đã áp dụng
cd backend
alembic current

# Xem lịch sử revision
alembic history
```

### 2. **Chạy migration upgrade**

```bash
# Upgrade lên version mới nhất
alembic upgrade head

# Hoặc upgrade đến phiên bản cụ thể
alembic upgrade 001
```

### 3. **Chạy migration downgrade (khôi phục lại)**

```bash
# Quay lại version trước đó
alembic downgrade -1

# Hoặc quay lại version cụ thể
alembic downgrade 000
```

### 4. **Tạo migration mới (nếu cần)**

```bash
alembic revision --autogenerate -m "Mô tả thay đổi"
```

---

## ✨ Lợi Ích của Phương Án Tách Bảng

| Khía Cạnh | Lợi Ích |
|----------|---------|
| **Quản Lý** | Dễ bảo trì, cập nhật từng phần |
| **Hiệu Suất** | Query chỉ lấy dữ liệu cần thiết |
| **Tái Sử Dụng** | Bệnh nhân/bác sĩ có thể có nhiều dự đoán |
| **Phân Quyền** | Kiểm soát truy cập chi tiết từng bảng |
| **Mở Rộng** | Dễ thêm bảng mới mà không ảnh hưởng hiện tại |
| **Lỗi** | Lỗi ở một bảng không ảnh hưởng bảng khác |

---

## 🔄 Cách Cập Nhật Code Khi Truy Vấn Dữ Liệu

### Trước (một bảng)
```python
# Query toàn bộ dữ liệu dự đoán
prediction = db.query(Prediction).filter(Prediction.id == 1).first()
name = prediction.patient_name
result = prediction.prediction
```

### Sau (nhiều bảng)
```python
# Query từ các bảng liên quan
prediction = db.query(Prediction).filter(Prediction.id == 1).first()
patient_info = prediction.patient_info
name = patient_info.patient_name if patient_info else None
results = prediction.results
prediction_type = results.prediction if results else None
```

### Hoặc sử dụng eager loading
```python
from sqlalchemy.orm import joinedload

prediction = db.query(Prediction)\
    .options(
        joinedload(Prediction.patient_info),
        joinedload(Prediction.results),
        joinedload(Prediction.analysis)
    )\
    .filter(Prediction.id == 1)\
    .first()
```

---

## 📝 Ghi Chú Quan Trọng

⚠️ **Lưu Ý:**
1. Migration sẽ **migrate dữ liệu cũ** tự động vào các bảng mới
2. **Backup database** trước khi chạy migration
3. Sau migration, cần cập nhật code để sử dụng models mới
4. Test kỹ lưỡng trước khi deploy lên production

---

## 🚀 Bước Tiếp Theo

1. ✅ Review migration file
2. ✅ Backup database
3. ✅ Chạy migration
4. ✅ Test các truy vấn
5. ✅ Cập nhật API code
6. ✅ Deploy lên production
