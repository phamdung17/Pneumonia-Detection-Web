from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from backend.database.models import Prediction


def build_prediction_pdf(prediction: Prediction) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    pdf.setTitle(f"XR-{prediction.id}")
    pdf.drawString(40, height - 40, "Pneumonia Detection Report")
    pdf.drawString(40, height - 70, f"Prediction ID: {prediction.id}")
    pdf.drawString(40, height - 90, f"Task ID: {prediction.task_id}")
    pdf.drawString(40, height - 110, f"Status: {prediction.status.value}")
    pdf.drawString(40, height - 130, f"Prediction: {prediction.prediction.value if prediction.prediction else 'N/A'}")
    pdf.drawString(40, height - 150, f"Confidence: {prediction.confidence if prediction.confidence is not None else 'N/A'}")
    pdf.drawString(40, height - 170, f"Doctor note: {prediction.doctor_note or '-'}")
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
