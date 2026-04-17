from io import BytesIO
from pathlib import Path

from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from backend.config import BASE_DIR
from backend.database.models import Prediction


def _setup_fonts() -> tuple[str, str]:
    regular = "Helvetica"
    bold = "Helvetica-Bold"

    candidates = [
        (Path("C:/Windows/Fonts/arial.ttf"), Path("C:/Windows/Fonts/arialbd.ttf")),
        (Path("C:/Windows/Fonts/tahoma.ttf"), Path("C:/Windows/Fonts/tahomabd.ttf")),
        (Path("C:/Windows/Fonts/segoeui.ttf"), Path("C:/Windows/Fonts/segoeuib.ttf")),
    ]

    for reg_path, bold_path in candidates:
        if reg_path.exists() and bold_path.exists():
            try:
                pdfmetrics.registerFont(TTFont("VN-Regular", str(reg_path)))
                pdfmetrics.registerFont(TTFont("VN-Bold", str(bold_path)))
                return "VN-Regular", "VN-Bold"
            except Exception:
                continue

    return regular, bold


FONT_REGULAR, FONT_BOLD = _setup_fonts()


def _format_dt(value) -> str:
    if value is None:
        return "-"
    return value.strftime("%Y-%m-%d %H:%M:%S")


def _format_pct(value: float | None) -> str:
    if value is None:
        return "-"
    return f"{value * 100:.1f}%"


def _prediction_label(prediction: Prediction) -> str:
    if not prediction.prediction:
        return "N/A"
    return prediction.prediction.value


def _resolve_existing_path(raw_path: str | None) -> Path | None:
    if not raw_path:
        return None

    path = Path(raw_path)
    candidates = [path]
    if not path.is_absolute():
        candidates.append((BASE_DIR.parent / path).resolve())
        candidates.append((BASE_DIR / path).resolve())

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate
    return None


def _resolve_original_image(prediction: Prediction) -> Path | None:
    return _resolve_existing_path(prediction.file_path)


def _resolve_heatmap_image(prediction: Prediction) -> Path | None:
    for candidate in (prediction.heatmap_dn_path, prediction.heatmap_eff_path):
        resolved = _resolve_existing_path(candidate)
        if resolved:
            return resolved

    original = _resolve_original_image(prediction)
    if original:
        fallback = original.with_name("heatmap.jpg")
        if fallback.exists() and fallback.is_file():
            return fallback
    return None


def _draw_header(pdf: canvas.Canvas, width: float, height: float, prediction: Prediction) -> float:
    top = height - 42
    pdf.setFillColor(colors.HexColor("#0F172A"))
    pdf.setFont(FONT_BOLD, 16)
    pdf.drawString(40, top, "BÁO CÁO CHẨN ĐOÁN X-QUANG NGỰC")

    pdf.setFillColor(colors.HexColor("#475569"))
    pdf.setFont(FONT_REGULAR, 9)
    pdf.drawRightString(width - 40, top + 2, f"Mã báo cáo: XR-{prediction.id}")
    pdf.drawRightString(width - 40, top - 12, f"Thời gian tạo: {_format_dt(prediction.created_at)}")

    pdf.setStrokeColor(colors.HexColor("#E2E8F0"))
    pdf.line(40, top - 20, width - 40, top - 20)
    return top - 34


def _draw_section_title(pdf: canvas.Canvas, x: float, y: float, title: str) -> float:
    pdf.setFillColor(colors.HexColor("#1E293B"))
    pdf.setFont(FONT_BOLD, 11)
    pdf.drawString(x, y, title)
    return y - 14


def _draw_key_value(pdf: canvas.Canvas, x: float, y: float, key: str, value: str, key_width: float = 130) -> float:
    pdf.setFont(FONT_REGULAR, 9)
    pdf.setFillColor(colors.HexColor("#64748B"))
    pdf.drawString(x, y, key)
    pdf.setFillColor(colors.HexColor("#0F172A"))
    pdf.setFont(FONT_BOLD, 9)
    pdf.drawString(x + key_width, y, value)
    return y - 14


def _draw_multiline_text(pdf: canvas.Canvas, x: float, y: float, width: float, text: str, line_height: float = 12) -> float:
    content = (text or "-").strip() or "-"
    words = content.split()
    if not words:
        pdf.drawString(x, y, "-")
        return y - line_height

    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        probe = f"{current} {word}"
        if pdf.stringWidth(probe, FONT_REGULAR, 9) <= width:
            current = probe
        else:
            lines.append(current)
            current = word
    lines.append(current)

    for line in lines:
        pdf.drawString(x, y, line)
        y -= line_height
    return y


def _image_metadata(path: Path | None) -> tuple[str, str]:
    if path is None:
        return "-", "-"

    try:
        with Image.open(path) as img:
            return path.name, f"{img.width}x{img.height}"
    except Exception:
        return path.name, "unknown"


def _draw_image_panel(pdf: canvas.Canvas, x: float, y: float, width: float, height: float, title: str, image_path: Path | None) -> float:
    pdf.setFillColor(colors.HexColor("#0F172A"))
    pdf.setFont(FONT_BOLD, 10)
    pdf.drawString(x, y, title)

    panel_top = y - 6
    panel_bottom = panel_top - height
    pdf.setStrokeColor(colors.HexColor("#CBD5E1"))
    pdf.setLineWidth(1)
    pdf.roundRect(x, panel_bottom, width, height, 8, stroke=1, fill=0)

    image_area_x = x + 8
    image_area_y = panel_bottom + 8
    image_area_w = width - 16
    image_area_h = height - 34

    if image_path is not None:
        try:
            image = ImageReader(str(image_path))
            iw, ih = image.getSize()
            if iw > 0 and ih > 0:
                scale = min(image_area_w / iw, image_area_h / ih)
                draw_w = iw * scale
                draw_h = ih * scale
                draw_x = image_area_x + (image_area_w - draw_w) / 2
                draw_y = image_area_y + (image_area_h - draw_h) / 2
                pdf.drawImage(image, draw_x, draw_y, width=draw_w, height=draw_h, preserveAspectRatio=True, mask="auto")
        except Exception:
            pdf.setFillColor(colors.HexColor("#94A3B8"))
            pdf.setFont(FONT_REGULAR, 9)
            pdf.drawCentredString(x + width / 2, panel_bottom + height / 2, "Không thể hiển thị ảnh")
    else:
        pdf.setFillColor(colors.HexColor("#94A3B8"))
        pdf.setFont(FONT_REGULAR, 9)
        pdf.drawCentredString(x + width / 2, panel_bottom + height / 2, "Không có dữ liệu ảnh")

    file_name, resolution = _image_metadata(image_path)
    pdf.setFillColor(colors.HexColor("#475569"))
    pdf.setFont(FONT_REGULAR, 8)
    pdf.drawString(x + 8, panel_bottom + 14, f"Tập tin: {file_name}")
    pdf.drawRightString(x + width - 8, panel_bottom + 14, f"Độ phân giải: {resolution}")
    return panel_bottom - 18


def build_prediction_pdf(prediction: Prediction) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    pdf.setTitle(f"XR-{prediction.id}")
    y = _draw_header(pdf, width, height, prediction)

    y = _draw_section_title(pdf, 40, y, "1) Thông tin ca chụp")
    y = _draw_key_value(pdf, 40, y, "Mã dự đoán", f"#{prediction.id}")
    y = _draw_key_value(pdf, 40, y, "Mã tác vụ", prediction.task_id)
    y = _draw_key_value(pdf, 40, y, "Trạng thái", prediction.status.value)
    y = _draw_key_value(pdf, 40, y, "Thời gian thực hiện", _format_dt(prediction.performed_at))
    y = _draw_key_value(pdf, 40, y, "Thời gian hoàn tất", _format_dt(prediction.completed_at))
    y -= 6

    y = _draw_section_title(pdf, 40, y, "2) Thông tin bệnh nhân")
    y = _draw_key_value(pdf, 40, y, "Họ tên", prediction.patient_name or "-")
    y = _draw_key_value(pdf, 40, y, "Tuổi", str(prediction.patient_age) if prediction.patient_age is not None else "-")
    y = _draw_key_value(pdf, 40, y, "Giới tính", prediction.patient_gender or "-")
    y = _draw_key_value(pdf, 40, y, "Kỹ thuật viên", prediction.technician_name or "-")
    y -= 6

    y = _draw_section_title(pdf, 40, y, "3) Kết quả AI")
    y = _draw_key_value(pdf, 40, y, "Kết luận", _prediction_label(prediction))
    y = _draw_key_value(pdf, 40, y, "Độ tin cậy mô hình", _format_pct(prediction.confidence))
    y = _draw_key_value(pdf, 40, y, "Xác suất viêm phổi", _format_pct(prediction.prob_dn))
    y = _draw_key_value(pdf, 40, y, "Loại bệnh", prediction.disease_type.value if prediction.disease_type else "N/A")
    y = _draw_key_value(pdf, 40, y, "Vi khuẩn", _format_pct(prediction.bacterial_prob))
    y = _draw_key_value(pdf, 40, y, "Virus", _format_pct(prediction.viral_prob))
    y = _draw_key_value(pdf, 40, y, "COVID", _format_pct(prediction.covid_prob))
    y -= 6

    y = _draw_section_title(pdf, 40, y, "4) Đánh giá lâm sàng")
    y = _draw_key_value(
        pdf,
        40,
        y,
        "Trạng thái bác sĩ",
        "ĐÃ XÁC NHẬN" if prediction.doctor_confirmed is True else "TỪ CHỐI" if prediction.doctor_confirmed is False else "CHỜ ĐÁNH GIÁ",
    )
    y = _draw_key_value(pdf, 40, y, "Ghi chú", "")
    pdf.setFont(FONT_REGULAR, 9)
    pdf.setFillColor(colors.HexColor("#0F172A"))
    _draw_multiline_text(pdf, 170, y + 14, width - 210, prediction.doctor_note or "-")

    pdf.setFillColor(colors.HexColor("#64748B"))
    pdf.setFont(FONT_REGULAR, 8)
    pdf.drawString(40, 28, "Báo cáo được tạo tự động từ hệ thống Pneumonia Detection.")

    pdf.showPage()

    y2 = _draw_header(pdf, width, height, prediction)
    y2 = _draw_section_title(pdf, 40, y2, "5) Hình ảnh chẩn đoán")

    original_image_path = _resolve_original_image(prediction)
    heatmap_image_path = _resolve_heatmap_image(prediction)

    panel_height = 300
    y2 = _draw_image_panel(pdf, 40, y2, width - 80, panel_height, "Ảnh X-quang gốc", original_image_path)
    _draw_image_panel(pdf, 40, y2, width - 80, panel_height, "Ảnh Grad-CAM", heatmap_image_path)

    pdf.save()
    return buffer.getvalue()
