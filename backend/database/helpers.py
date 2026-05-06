"""
Helper functions để làm việc với bảng tách

Cung cấp các hàm tiện lợi để truy vấn dữ liệu từ các bảng tách
thay vì phải viết các joinedload phức tạp
"""

from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from backend.database.models import (
    EnsembleStatus,
    DiseaseType,
    PredictionLabel,
    Prediction,
    PredictionPatientInfo,
    PredictionResults,
    PredictionAnalysis,
    PredictionDoctorReview,
    PredictionProcessingLog,
    User,
    UserProfile,
    UserSecurityLog,
)


UNSET = object()


# ============================================================================
# HELPERS CHO PREDICTION
# ============================================================================

def get_prediction_full(
    db: Session,
    prediction_id: int,
    include_all: bool = True
) -> Optional[Prediction]:
    """
    Lấy thông tin dự đoán đầy đủ với tất cả các thông tin liên quan.
    
    Args:
        db: Database session
        prediction_id: ID của dự đoán
        include_all: Có load tất cả relationships hay không
    
    Returns:
        Prediction object với tất cả dữ liệu liên quan
    
    Example:
        >>> prediction = get_prediction_full(db, prediction_id=1)
        >>> print(prediction.patient_info.patient_name)
        >>> print(prediction.results.confidence)
    """
    query = db.query(Prediction).filter(Prediction.id == prediction_id)
    
    if include_all:
        query = query.options(
            joinedload(Prediction.patient_info),
            joinedload(Prediction.results),
            joinedload(Prediction.analysis),
            joinedload(Prediction.doctor_review),
            joinedload(Prediction.processing_log),
            joinedload(Prediction.user)
        )
    
    return query.first()


def get_prediction_with_patient_info(
    db: Session,
    prediction_id: int
) -> Optional[Prediction]:
    """Lấy dự đoán với thông tin bệnh nhân"""
    return db.query(Prediction)\
        .options(joinedload(Prediction.patient_info))\
        .filter(Prediction.id == prediction_id)\
        .first()


def get_prediction_with_results(
    db: Session,
    prediction_id: int
) -> Optional[Prediction]:
    """Lấy dự đoán với kết quả phân loại"""
    return db.query(Prediction)\
        .options(joinedload(Prediction.results))\
        .filter(Prediction.id == prediction_id)\
        .first()


def get_prediction_with_analysis(
    db: Session,
    prediction_id: int
) -> Optional[Prediction]:
    """Lấy dự đoán với phân tích hình ảnh"""
    return db.query(Prediction)\
        .options(joinedload(Prediction.analysis))\
        .filter(Prediction.id == prediction_id)\
        .first()


def get_prediction_with_doctor_review(
    db: Session,
    prediction_id: int
) -> Optional[Prediction]:
    """Lấy dự đoán với xét duyệt bác sĩ"""
    return db.query(Prediction)\
        .options(joinedload(Prediction.doctor_review))\
        .filter(Prediction.id == prediction_id)\
        .first()


def get_user_predictions(
    db: Session,
    user_id: int,
    include_details: bool = False
) -> list[Prediction]:
    """
    Lấy danh sách các dự đoán của một người dùng.
    
    Args:
        db: Database session
        user_id: ID người dùng
        include_details: Có load chi tiết hay không
    
    Returns:
        Danh sách các dự đoán
    """
    query = db.query(Prediction).filter(Prediction.user_id == user_id)
    
    if include_details:
        query = query.options(
            joinedload(Prediction.patient_info),
            joinedload(Prediction.results),
            joinedload(Prediction.processing_log)
        )
    
    return query.all()


def get_predictions_by_status(
    db: Session,
    status: str,
    include_details: bool = False
) -> list[Prediction]:
    """
    Lấy danh sách các dự đoán theo trạng thái.
    
    Args:
        db: Database session
        status: Trạng thái ('queued', 'processing', 'done', 'failed')
        include_details: Có load chi tiết hay không
    
    Returns:
        Danh sách các dự đoán
    """
    query = db.query(Prediction).filter(Prediction.status == status)
    
    if include_details:
        query = query.options(
            joinedload(Prediction.patient_info),
            joinedload(Prediction.results),
            joinedload(Prediction.processing_log)
        )
    
    return query.all()


# ============================================================================
# HELPERS CHO USER
# ============================================================================

def get_user_full(
    db: Session,
    user_id: int
) -> Optional[User]:
    """
    Lấy thông tin người dùng đầy đủ.
    
    Args:
        db: Database session
        user_id: ID người dùng
    
    Returns:
        User object với profile và security log
    
    Example:
        >>> user = get_user_full(db, user_id=1)
        >>> print(user.user_profile.full_name)
        >>> print(user.user_security_log.last_login)
    """
    return db.query(User)\
        .options(
            joinedload(User.user_profile),
            joinedload(User.user_security_log)
        )\
        .filter(User.id == user_id)\
        .first()


def get_user_with_profile(
    db: Session,
    user_id: int
) -> Optional[User]:
    """Lấy người dùng với thông tin cá nhân"""
    return db.query(User)\
        .options(joinedload(User.user_profile))\
        .filter(User.id == user_id)\
        .first()


def get_user_with_security_log(
    db: Session,
    user_id: int
) -> Optional[User]:
    """Lấy người dùng với lịch sử bảo mật"""
    return db.query(User)\
        .options(joinedload(User.user_security_log))\
        .filter(User.id == user_id)\
        .first()


def get_user_security_log(db: Session, user_id: int):
    """Return the UserSecurityLog record for a user, if any."""
    return db.query(UserSecurityLog).filter(UserSecurityLog.user_id == user_id).first()


def create_user_profile(
    db: Session,
    user_id: int,
    *,
    full_name: str,
    email: str | None = None,
    phone: str | None = None,
    avatar_url: str | None = None,
) -> UserProfile:
    existing = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if existing:
        existing.full_name = full_name
        existing.email = email
        existing.phone = phone
        existing.avatar_url = avatar_url
        db.add(existing)
        return existing

    profile = UserProfile(
        user_id=user_id,
        full_name=full_name,
        email=email,
        phone=phone,
        avatar_url=avatar_url,
    )
    db.add(profile)
    return profile


def create_user_security_log(
    db: Session,
    user_id: int,
    *,
    failed_login_count: int = 0,
    locked_until: object | None = None,
    last_login: object | None = None,
) -> UserSecurityLog:
    existing = db.query(UserSecurityLog).filter(UserSecurityLog.user_id == user_id).first()
    if existing:
        existing.failed_login_count = failed_login_count
        existing.locked_until = locked_until
        existing.last_login = last_login
        db.add(existing)
        return existing

    log = UserSecurityLog(
        user_id=user_id,
        failed_login_count=failed_login_count,
        locked_until=locked_until,
        last_login=last_login,
    )
    db.add(log)
    return log


def update_user_security_log(
    db: Session,
    user_id: int,
    *,
    failed_login_count: int | object = UNSET,
    locked_until: object = UNSET,
    last_login: object = UNSET,
):
    """Create or update the UserSecurityLog for the given user."""
    existing = db.query(UserSecurityLog).filter(UserSecurityLog.user_id == user_id).first()
    from datetime import datetime

    if existing:
        if failed_login_count is not UNSET:
            existing.failed_login_count = failed_login_count
        if locked_until is not UNSET:
            existing.locked_until = locked_until
        if last_login is not UNSET:
            existing.last_login = last_login
        db.add(existing)
        return existing

    new = UserSecurityLog(
        user_id=user_id,
        failed_login_count=0 if failed_login_count is UNSET else failed_login_count,
        locked_until=None if locked_until is UNSET else locked_until,
        last_login=None if last_login is UNSET else last_login,
    )
    db.add(new)
    return new


def get_user_by_username_full(
    db: Session,
    username: str
) -> Optional[User]:
    """Lấy người dùng theo username với thông tin đầy đủ"""
    return db.query(User)\
        .options(
            joinedload(User.user_profile),
            joinedload(User.user_security_log)
        )\
        .filter(User.username == username)\
        .first()


# ============================================================================
# DTO CLASSES (Data Transfer Objects) - Cho API responses
# ============================================================================

class PredictionDetailDTO:
    """DTO để trả về thông tin dự đoán chi tiết"""
    
    def __init__(self, prediction: Prediction):
        self.id = prediction.id
        self.user_id = prediction.user_id
        self.task_id = prediction.task_id
        self.filename = prediction.filename
        self.file_path = prediction.file_path
        self.status = prediction.status
        self.created_at = prediction.created_at
        
        # Patient info
        if prediction.patient_info:
            self.patient = {
                "name": prediction.patient_info.patient_name,
                "age": prediction.patient_info.patient_age,
                "gender": prediction.patient_info.patient_gender,
                "technician": prediction.patient_info.technician_name,
                "performed_at": prediction.patient_info.performed_at,
            }
        else:
            self.patient = None
        
        # Prediction results
        if prediction.results:
            self.results = {
                "prediction": prediction.results.prediction,
                "ensemble_status": prediction.results.ensemble_status,
                "confidence": prediction.results.confidence,
                "disease_type": prediction.results.disease_type,
                "probabilities": {
                    "normal": prediction.results.prob_dn,
                    "pneumonia": prediction.results.prob_eff,
                    "bacterial": prediction.results.bacterial_prob,
                    "viral": prediction.results.viral_prob,
                    "covid": prediction.results.covid_prob,
                }
            }
        else:
            self.results = None
        
        # Analysis
        if prediction.analysis:
            self.analysis = {
                "lesion_percentage": prediction.analysis.lesion_pct,
                "bounding_box": {
                    "x1": prediction.analysis.bbox_x1,
                    "y1": prediction.analysis.bbox_y1,
                    "x2": prediction.analysis.bbox_x2,
                    "y2": prediction.analysis.bbox_y2,
                },
                "dice_score": prediction.analysis.dice_score,
                "heatmap_paths": {
                    "normal": prediction.analysis.heatmap_dn_path,
                    "pneumonia": prediction.analysis.heatmap_eff_path,
                },
                "lung_mask_path": prediction.analysis.lung_mask_path,
            }
        else:
            self.analysis = None
        
        # Doctor review
        if prediction.doctor_review:
            self.doctor_review = {
                "note": prediction.doctor_review.doctor_note,
                "confirmed": prediction.doctor_review.doctor_confirmed,
                "reviewed_at": prediction.doctor_review.reviewed_at,
            }
        else:
            self.doctor_review = None
        
        # Processing log
        if prediction.processing_log:
            self.processing = {
                "error_message": prediction.processing_log.error_message,
                "processing_time_ms": prediction.processing_log.processing_time_ms,
                "completed_at": prediction.processing_log.completed_at,
            }
        else:
            self.processing = None
    
    def to_dict(self) -> dict:
        """Chuyển đổi thành dictionary cho JSON response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "task_id": self.task_id,
            "filename": self.filename,
            "file_path": self.file_path,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "patient": self.patient,
            "results": self.results,
            "analysis": self.analysis,
            "doctor_review": self.doctor_review,
            "processing": self.processing,
        }


class UserDetailDTO:
    """DTO để trả về thông tin người dùng chi tiết"""
    
    def __init__(self, user: User):
        self.id = user.id
        self.username = user.username
        self.role = user.role
        self.is_active = user.is_active
        self.created_at = user.created_at
        
        # Profile
        if user.user_profile:
            self.profile = {
                "full_name": user.user_profile.full_name,
                "email": user.user_profile.email,
                "phone": user.user_profile.phone,
                "avatar_url": user.user_profile.avatar_url,
            }
        else:
            self.profile = None
        
        # Security
        if user.user_security_log:
            self.security = {
                "failed_login_count": user.user_security_log.failed_login_count,
                "locked_until": user.user_security_log.locked_until,
                "last_login": user.user_security_log.last_login,
            }
        else:
            self.security = None
    
    def to_dict(self) -> dict:
        """Chuyển đổi thành dictionary cho JSON response"""
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "profile": self.profile,
            "security": self.security,
        }


# ============================================================================
# EXAMPLES
# ============================================================================

"""
CÁCH SỬ DỤNG:

1. Lấy dự đoán với tất cả chi tiết:
   prediction = get_prediction_full(db, prediction_id=1)
   dto = PredictionDetailDTO(prediction)
   return dto.to_dict()

2. Lấy dự đoán của người dùng:
   predictions = get_user_predictions(db, user_id=1, include_details=True)
   return [PredictionDetailDTO(p).to_dict() for p in predictions]

3. Lấy người dùng với thông tin đầy đủ:
   user = get_user_full(db, user_id=1)
   dto = UserDetailDTO(user)
   return dto.to_dict()

4. Tìm người dùng theo username:
   user = get_user_by_username_full(db, username="admin")
   if user:
       print(f"Full name: {user.user_profile.full_name}")
       print(f"Last login: {user.user_security_log.last_login}")
"""

# ============================================================================
# CREATE FUNCTIONS FOR PREDICTION DETAILS
# ============================================================================

def create_prediction_results(
    db: Session,
    prediction_id: int,
    prediction: Optional[object] = None,
    ensemble_status: Optional[str] = None,
    confidence: Optional[float] = None,
    prob_dn: Optional[float] = None,
    prob_eff: Optional[float] = None,
    disease_type: Optional[str] = None,
    bacterial_prob: Optional[float] = None,
    viral_prob: Optional[float] = None,
    covid_prob: Optional[float] = None,
) -> PredictionResults:
    """Create or update prediction results"""
    if isinstance(prediction, str):
        prediction = PredictionLabel[prediction] if prediction in PredictionLabel.__members__ else PredictionLabel(prediction)
    if isinstance(ensemble_status, str):
        ensemble_status = EnsembleStatus[ensemble_status] if ensemble_status in EnsembleStatus.__members__ else EnsembleStatus(ensemble_status)
    if isinstance(disease_type, str):
        disease_type = DiseaseType[disease_type] if disease_type in DiseaseType.__members__ else DiseaseType(disease_type)

    existing = db.query(PredictionResults).filter(
        PredictionResults.prediction_id == prediction_id
    ).first()
    
    if existing:
        existing.prediction = prediction
        existing.ensemble_status = ensemble_status
        existing.confidence = confidence
        existing.prob_dn = prob_dn
        existing.prob_eff = prob_eff
        existing.disease_type = disease_type
        existing.bacterial_prob = bacterial_prob
        existing.viral_prob = viral_prob
        existing.covid_prob = covid_prob
        db.add(existing)
        return existing
    
    results = PredictionResults(
        prediction_id=prediction_id,
        prediction=prediction,
        ensemble_status=ensemble_status,
        confidence=confidence,
        prob_dn=prob_dn,
        prob_eff=prob_eff,
        disease_type=disease_type,
        bacterial_prob=bacterial_prob,
        viral_prob=viral_prob,
        covid_prob=covid_prob,
    )
    db.add(results)
    return results


def create_prediction_analysis(
    db: Session,
    prediction_id: int,
    lesion_pct: Optional[float] = None,
    bbox_x1: Optional[int] = None,
    bbox_y1: Optional[int] = None,
    bbox_x2: Optional[int] = None,
    bbox_y2: Optional[int] = None,
    dice_score: Optional[float] = None,
    heatmap_dn_path: Optional[str] = None,
    heatmap_eff_path: Optional[str] = None,
    lung_mask_path: Optional[str] = None,
) -> PredictionAnalysis:
    """Create or update prediction analysis"""
    existing = db.query(PredictionAnalysis).filter(
        PredictionAnalysis.prediction_id == prediction_id
    ).first()
    
    if existing:
        existing.lesion_pct = lesion_pct
        existing.bbox_x1 = bbox_x1
        existing.bbox_y1 = bbox_y1
        existing.bbox_x2 = bbox_x2
        existing.bbox_y2 = bbox_y2
        existing.dice_score = dice_score
        existing.heatmap_dn_path = heatmap_dn_path
        existing.heatmap_eff_path = heatmap_eff_path
        existing.lung_mask_path = lung_mask_path
        db.add(existing)
        return existing
    
    analysis = PredictionAnalysis(
        prediction_id=prediction_id,
        lesion_pct=lesion_pct,
        bbox_x1=bbox_x1,
        bbox_y1=bbox_y1,
        bbox_x2=bbox_x2,
        bbox_y2=bbox_y2,
        dice_score=dice_score,
        heatmap_dn_path=heatmap_dn_path,
        heatmap_eff_path=heatmap_eff_path,
        lung_mask_path=lung_mask_path,
    )
    db.add(analysis)
    return analysis


def create_prediction_doctor_review(
    db: Session,
    prediction_id: int,
    doctor_note: Optional[str] = None,
    doctor_confirmed: Optional[bool] = None,
    reviewed_at: Optional[object] = None,
) -> PredictionDoctorReview:
    """Create or update doctor review"""
    from datetime import datetime
    
    existing = db.query(PredictionDoctorReview).filter(
        PredictionDoctorReview.prediction_id == prediction_id
    ).first()
    
    if existing:
        if doctor_note is not None:
            existing.doctor_note = doctor_note
        if doctor_confirmed is not None:
            existing.doctor_confirmed = doctor_confirmed
        if reviewed_at is not None:
            existing.reviewed_at = reviewed_at
        else:
            existing.reviewed_at = datetime.utcnow()
        db.add(existing)
        return existing
    
    review = PredictionDoctorReview(
        prediction_id=prediction_id,
        doctor_note=doctor_note,
        doctor_confirmed=doctor_confirmed,
        reviewed_at=reviewed_at or datetime.utcnow(),
    )
    db.add(review)
    return review


def create_prediction_processing_log(
    db: Session,
    prediction_id: int,
    error_message: Optional[str] = None,
    processing_time_ms: Optional[int] = None,
    completed_at: Optional[object] = None,
) -> PredictionProcessingLog:
    """Create or update processing log"""
    existing = db.query(PredictionProcessingLog).filter(
        PredictionProcessingLog.prediction_id == prediction_id
    ).first()
    
    if existing:
        if error_message is not None:
            existing.error_message = error_message
        if processing_time_ms is not None:
            existing.processing_time_ms = processing_time_ms
        if completed_at is not None:
            existing.completed_at = completed_at
        db.add(existing)
        return existing
    
    log = PredictionProcessingLog(
        prediction_id=prediction_id,
        error_message=error_message,
        processing_time_ms=processing_time_ms,
        completed_at=completed_at,
    )
    db.add(log)
    return log


def create_prediction_patient_info(
    db: Session,
    prediction_id: int,
    patient_name: Optional[str] = None,
    patient_age: Optional[int] = None,
    patient_gender: Optional[str] = None,
    technician_name: Optional[str] = None,
    performed_at: Optional[object] = None,
) -> PredictionPatientInfo:
    """Create patient info for prediction"""
    existing = db.query(PredictionPatientInfo).filter(
        PredictionPatientInfo.prediction_id == prediction_id
    ).first()
    
    if existing:
        existing.patient_name = patient_name or existing.patient_name
        existing.patient_age = patient_age or existing.patient_age
        existing.patient_gender = patient_gender or existing.patient_gender
        existing.technician_name = technician_name or existing.technician_name
        existing.performed_at = performed_at or existing.performed_at
        db.add(existing)
        return existing
    
    info = PredictionPatientInfo(
        prediction_id=prediction_id,
        patient_name=patient_name,
        patient_age=patient_age,
        patient_gender=patient_gender,
        technician_name=technician_name,
        performed_at=performed_at,
    )
    db.add(info)
    return info


# ============================================================================
# EXAMPLES
# ============================================================================
