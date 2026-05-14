# Grad-CAM trong hệ thống chẩn đoán viêm phổi

Tài liệu này mô tả riêng cơ chế Grad-CAM trong backend hiện tại, đặc biệt là cách sinh heatmap từ ảnh X-quang sau khi mô hình dự đoán xong.

## 1. Grad-CAM được dùng để làm gì?

Grad-CAM là bước giải thích mô hình. Nó tạo một bản đồ nhiệt cho biết vùng ảnh nào ảnh hưởng mạnh đến quyết định của model.

Trong hệ thống này, Grad-CAM không phải là một model riêng để dự đoán. Nó là một nhánh phụ của pipeline dự đoán, chạy sau bước phân loại ảnh.

Kết quả cuối cùng là một file heatmap đã được chồng lên ảnh gốc và lưu thành `heatmap.jpg` trong thư mục của từng lần dự đoán.

## 2. Luồng tổng quát

Luồng thực tế trong code hiện tại là:

1. Người dùng upload ảnh X-quang.
2. Backend chạy phân loại ảnh bằng ONNX để lấy kết quả `NORMAL` hoặc `PNEUMONIA`.
3. Nếu model PyTorch Grad-CAM đã được load, backend sinh heatmap từ chính ảnh đó.
4. Heatmap được overlay lên ảnh gốc và lưu ra đĩa.
5. Backend trả về đường dẫn `heatmap_url` để frontend hiển thị.

## 3. Các file liên quan

- [backend/models/pipeline.py](backend/models/pipeline.py)
- [backend/models/loader.py](backend/models/loader.py)
- [backend/worker/tasks.py](backend/worker/tasks.py)
- [backend/api/predict.py](backend/api/predict.py)
- [frontend/src/components/PredictiveAnalysis.tsx](../frontend/src/components/PredictiveAnalysis.tsx)
- [frontend/src/pages/HistoryDetail.tsx](../frontend/src/pages/HistoryDetail.tsx)

## 4. Model nào được dùng cho Grad-CAM?

Backend dùng một model PyTorch DenseNet multi-head, được khai báo trong `DenseNetMultiHead`.

Model này có hai nhánh đầu ra:

- Nhánh binary: dự đoán có viêm phổi hay không.
- Nhánh type: phân loại kiểu bệnh nếu ảnh được dự đoán là viêm phổi.

Grad-CAM sẽ bám vào layer sâu nhất của backbone DenseNet, cụ thể là `denseblock4`.

## 5. Cách sinh heatmap cụ thể

### 5.1. Chuẩn bị ảnh đầu vào

Hàm `_load_rgb(path)` đọc ảnh bằng OpenCV rồi đổi từ BGR sang RGB.

Tiếp theo `_preprocess_onnx(rgb)`:

- resize ảnh về `224 x 224`
- chuyển về float32 và scale về khoảng `[0, 1]`
- chuẩn hóa bằng mean/std ImageNet
- đổi từ HWC sang CHW
- thêm batch dimension để thành tensor đầu vào

Sau đó `_tensor_for_gradcam(rgb)` chuyển numpy array sang tensor PyTorch và đưa lên device hiện tại.

### 5.2. Gắn hook vào layer trung gian

Lớp `GradCAM` đăng ký hai hook lên `denseblock4`:

- forward hook để lấy activation map khi chạy tiến về phía trước
- backward hook để lấy gradient khi backprop từ score mục tiêu

Ý nghĩa của hai hook này là:

- activation cho biết layer đang “nhìn thấy” gì
- gradient cho biết output đang phụ thuộc vào vùng nào của activation

### 5.3. Chọn score để backprop

Khi gọi `GradCAM(...)`, code chạy forward model và nhận 2 nhánh output:

- `logit_bin`
- `logit_type`

Sau đó chọn score cần giải thích:

- nếu `target_head='binary'` thì lấy tổng `logit_bin`
- nếu `target_head='type'` thì lấy logit tương ứng với nhãn loại bệnh

Trong code hiện tại:

- nếu ảnh được dự đoán là `PNEUMONIA` và có `disease_type` hợp lệ, Grad-CAM bám vào nhánh type
- nếu không, nó bám vào nhánh binary

### 5.4. Tính Grad-CAM map

Sau khi chọn score, code gọi `score.backward()` để lấy gradient.

Rồi tính heatmap theo công thức Grad-CAM chuẩn:

```text
weights = mean(gradients, over spatial dimensions)
cam = sum(weights * activations, over channels)
cam = ReLU(cam)
```

Sau đó:

- resize cam về kích thước ảnh đầu vào bằng bilinear interpolation
- chuẩn hóa min-max về khoảng `[0, 1]`

Nếu cam không có độ biến thiên, code trả về mảng toàn 0 để tránh lỗi chia cho 0.

### 5.5. Overlay lên ảnh gốc

Hàm `_overlay_heatmap(rgb, heatmap, alpha=0.4)` làm 3 bước:

- resize heatmap về đúng kích thước ảnh gốc
- đổi heatmap sang thang màu JET của OpenCV
- blend heatmap với ảnh gốc theo công thức:

```text
blended = alpha * heatmap_color + (1 - alpha) * original_image
```

Giá trị `alpha = 0.4` nghĩa là heatmap chiếm 40%, ảnh gốc chiếm 60%.

### 5.6. Lưu file heatmap

Ảnh overlay sau cùng được ghi ra:

```text
<task_dir>/heatmap.jpg
```

Trong code, `task_dir` là thư mục cha của file ảnh upload, nên mỗi prediction sẽ có một thư mục riêng theo task.

## 6. Khi nào heatmap được tạo?

Heatmap chỉ được sinh nếu:

- ONNX model load thành công
- PyTorch Grad-CAM model load thành công
- file weight `densenet_multihead_best.pth` tồn tại

Nếu weight Grad-CAM không có, backend vẫn chạy dự đoán bình thường, nhưng `generate_gradcam(...)` sẽ trả về `None`.

Trong log, trường hợp này thường xuất hiện dưới dạng:

```text
torch_gradcam_weights_missing
```

## 7. Backend trả heatmap cho frontend như thế nào?

Trong `run_pipeline(...)`, backend trả về:

- `heatmap_dn_path`
- `heatmap_eff_path`

Hiện tại hệ thống chỉ gán `heatmap_dn_path = heatmap_path` và `heatmap_eff_path = None`.

Sau đó `serialize_prediction(...)` trong API dự đoán chuyển `heatmap_dn_path` thành `heatmap_url` để frontend dùng.

Trong API history, nếu `heatmap_url` tồn tại thì frontend sẽ hiển thị heatmap trong trang chi tiết lịch sử.

## 8. Tại sao có lúc chỉ thấy một heatmap?

Trong code hiện tại, pipeline chỉ sinh một file `heatmap.jpg`, không tách riêng heatmap cho từng nhánh `dn` và `eff`.

Điều đó có nghĩa là:

- backend có sẵn schema cho hai cột `heatmap_dn_path` và `heatmap_eff_path`
- nhưng implementation hiện tại mới chỉ nối một nhánh, còn nhánh còn lại đang để trống

Nói ngắn gọn: đây là một Grad-CAM đơn bản đồ, không phải bộ 2 heatmap độc lập.

## 9. Mối liên hệ với worker pipeline

Trong worker, Grad-CAM là một stage riêng:

- stage `T1`: dự đoán AI
- stage `gradcam`: tạo heatmap
- stage `final`: trả kết quả hoàn tất

`run_prediction_task(...)` cập nhật task state theo từng stage để frontend có thể hiển thị tiến trình.

## 10. Tóm tắt ngắn

Grad-CAM ở đây hoạt động theo đúng kiểu canonical:

1. chạy forward qua DenseNet
2. chọn score cần giải thích
3. backprop để lấy gradient tại `denseblock4`
4. nhân gradient trung bình với activation map
5. ReLU + resize + normalize
6. overlay heatmap lên ảnh gốc
7. lưu ra `heatmap.jpg`
8. trả đường dẫn cho frontend hiển thị

## 11. Ghi chú thực tế

- Nếu muốn heatmap luôn có, cần đảm bảo file weight Grad-CAM tồn tại trong thư mục `backend/weights`.
- Nếu muốn tách riêng hai heatmap cho hai nhánh, cần mở rộng `generate_gradcam(...)` để sinh thêm một bản cho nhánh còn lại và trả cả `heatmap_eff_path`.
- Nếu chỉ cần xem vùng mô hình quan tâm, file `heatmap.jpg` hiện tại đã đủ.