# Cap Nhat Chuc Nang Profile Va Admin

## 1. Phan he Profile

- Da bo sung trang Profile thuc te tai `frontend/src/pages/Profile.tsx`.
- Ho tro hien thi thong tin tai khoan hien tai, bao gom:
  - ho va ten
  - ten dang nhap
  - email
  - so dien thoai
  - avatar URL
  - vai tro
  - trang thai hoat dong
  - lan dang nhap cuoi
- Bo sung chuc nang cap nhat thong tin ca nhan:
  - cho phep sua `full_name`, `email`, `phone`, `avatar_url`
  - khi cap nhat ho so phai nhap lai mat khau hien tai
- Bo sung chuc nang doi mat khau:
  - yeu cau nhap mat khau cu
  - ap dung quy tac mat khau manh:
    - toi thieu 8 ky tu
    - co it nhat 1 chu hoa
    - co it nhat 1 chu thuong
    - co it nhat 1 chu so
    - co it nhat 1 ky tu dac biet
- Bo sung kiem tra hop le so dien thoai trong qua trinh cap nhat profile.
- Bo sung ghi nhat ky audit cho cac thao tac lien quan den profile:
  - `profile_update`
  - `password_change`

## 2. Phan he Admin

- Da bo sung trang dashboard admin tai `frontend/src/pages/admin/Dashboard.tsx`.
- Da bo sung API dashboard admin tai `GET /api/admin/dashboard`.
- Dashboard admin hien thi cac chi so:
  - tong so nguoi dung
  - so nguoi dung dang hoat dong
  - so nguoi dung bi khoa
  - tong so prediction
  - so prediction thanh cong
  - so prediction that bai

- Nang cap trang quan ly nguoi dung tai `frontend/src/pages/admin/Users.tsx`.
- Admin co the:
  - xem danh sach nguoi dung
  - tim kiem theo ten, username, email hoac so dien thoai
  - xem thong tin chi tiet cua tung user
  - thay doi vai tro user
  - bat/tat kha nang dang nhap thong qua `is_active`
  - khoa tai khoan ma khong xoa du lieu
  - mo khoa tai khoan bi khoa do dang nhap sai nhieu lan
- He thong chan admin tu khoa chinh tai khoan cua minh.
- Hanh vi xoa user da duoc doi thanh khoa mem tai khoan thay vi xoa cung.

- Da bo sung giao dien Audit log tai `frontend/src/pages/admin/AuditLogs.tsx`.
- Da bo sung backend ho tro tim kiem audit log voi bo loc co ban.
- Cai tien Audit log:
  - thoi gian hien thi theo mui gio `Asia/Bangkok`
  - bo sung truong `created_at_local`
  - cot target hien thi theo dinh dang `full_name (username)`
  - neu khong xac dinh duoc doi tuong thi hien `System`

## 3. Co so du lieu va Backend

- Mo rong bang `users` voi hai truong moi:
  - `phone`
  - `avatar_url`
- Cap nhat dong bo schema trong `backend/database/schema_sync.py` de tu them cot moi khi chay app.
- Mo rong cac schema response va request de phu hop voi luong Profile va Admin moi.

## 4. Dieu huong va Giao dien

- Bo sung cac route moi:
  - `/profile`
  - `/admin`
  - `/admin/audit`
- Cap nhat sidebar de hien thi:
  - Profile
  - Dashboard admin
  - Quan ly nguoi dung
  - Audit log

## 5. Ghi chu

- Backend validation da duoc cap nhat de phu hop voi cac chuc nang moi.
- Du lieu audit log da de doc hon, phu hop cho demo va quan tri he thong.
- Frontend va backend da duoc dong bo de trang Profile va Admin su dung du lieu API thuc te.
