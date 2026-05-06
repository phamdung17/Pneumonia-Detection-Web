# 📊 Sơ Đồ ERD - Pneumonia Detection System

Các sơ đồ Entity Relationship Diagram (ERD) cho cơ sở dữ liệu sau khi tách bảng.

---

## 📊 Sơ Đồ 1: ERD Đầy Đủ (Full Schema)

```mermaid
erDiagram
    USERS ||--o{ USER_PROFILES : has
    USERS ||--o{ USER_SECURITY_LOGS : has
    USERS ||--o{ REFRESH_TOKENS : has
    USERS ||--o{ PREDICTIONS : creates
    USERS ||--o{ AUDIT_LOGS : generates
    
    PREDICTIONS ||--o{ PREDICTION_PATIENT_INFO : contains
    PREDICTIONS ||--o{ PREDICTION_RESULTS : contains
    PREDICTIONS ||--o{ PREDICTION_ANALYSIS : contains
    PREDICTIONS ||--o{ PREDICTION_DOCTOR_REVIEW : contains
    PREDICTIONS ||--o{ PREDICTION_PROCESSING_LOG : contains

    USERS {
        int id PK
        string username UK
        string password_hash
        string role
        bool is_active
        datetime created_at
    }

    USER_PROFILES {
        int id PK
        int user_id FK "UK"
        string full_name
        string email
        string phone
        string avatar_url
        datetime created_at
    }

    USER_SECURITY_LOGS {
        int id PK
        int user_id FK "UK"
        int failed_login_count
        datetime locked_until
        datetime last_login
        datetime created_at
    }

    REFRESH_TOKENS {
        int id PK
        int user_id FK
        string token_hash UK
        datetime expires_at
        bool is_revoked
        datetime revoked_at
        datetime created_at
    }

    PREDICTIONS {
        int id PK
        int user_id FK
        string task_id UK
        string filename
        string file_path
        string status
        datetime created_at
    }

    PREDICTION_PATIENT_INFO {
        int id PK
        int prediction_id FK "UK"
        string patient_name
        int patient_age
        string patient_gender
        string technician_name
        datetime performed_at
        datetime created_at
    }

    PREDICTION_RESULTS {
        int id PK
        int prediction_id FK "UK"
        string prediction
        string ensemble_status
        float confidence
        float prob_dn
        float prob_eff
        string disease_type
        float bacterial_prob
        float viral_prob
        float covid_prob
        datetime created_at
    }

    PREDICTION_ANALYSIS {
        int id PK
        int prediction_id FK "UK"
        float lesion_pct
        int bbox_x1
        int bbox_y1
        int bbox_x2
        int bbox_y2
        float dice_score
        string heatmap_dn_path
        string heatmap_eff_path
        string lung_mask_path
        datetime created_at
    }

    PREDICTION_DOCTOR_REVIEW {
        int id PK
        int prediction_id FK "UK"
        string doctor_note
        bool doctor_confirmed
        datetime reviewed_at
        datetime created_at
    }

    PREDICTION_PROCESSING_LOG {
        int id PK
        int prediction_id FK "UK"
        string error_message
        int processing_time_ms
        datetime completed_at
        datetime created_at
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action
        string target_type
        string target_id
        string ip_address
        string user_agent
        json detail
        datetime created_at
    }
```

---

## 📊 Sơ Đồ 2: So Sánh Trước/Sau Khi Tách Bảng

```mermaid
graph TB
    subgraph TRƯỚC["❌ TRƯỚC - Bảng Lớn (Không Tách)"]
        U1["<b>users</b><br/>14 cột<br/>id, username, email,<br/>phone, avatar_url,<br/>password_hash,<br/>full_name, role,<br/>is_active,<br/>failed_login_count,<br/>locked_until,<br/>last_login,<br/>created_at"]
        
        P1["<b>predictions</b><br/>52 cột<br/>id, user_id, task_id,<br/>filename, file_path,<br/>patient_name,<br/>patient_age,<br/>patient_gender,<br/>technician_name,<br/>performed_at,<br/>prediction,<br/>ensemble_status,<br/>confidence,<br/>prob_dn, prob_eff,<br/>disease_type,<br/>bacterial_prob,<br/>viral_prob,<br/>covid_prob,<br/>lesion_pct,<br/>bbox_x1/y1/x2/y2,<br/>dice_score,<br/>heatmap_*_path,<br/>lung_mask_path,<br/>doctor_note,<br/>doctor_confirmed,<br/>status, error_message,<br/>processing_time_ms,<br/>completed_at,<br/>created_at"]
        
        U1 -->|"1:∞"| P1
    end
    
    subgraph SAU["✅ SAU - Bảng Tách (Chuẩn Hóa)"]
        U2["<b>users</b><br/>5 cột<br/>id, username,<br/>password_hash,<br/>role, is_active"]
        
        UP["<b>user_profiles</b><br/>5 cột<br/>id, user_id,<br/>full_name, email,<br/>phone, avatar_url"]
        
        UL["<b>user_security_logs</b><br/>5 cột<br/>id, user_id,<br/>failed_login_count,<br/>locked_until,<br/>last_login"]
        
        P2["<b>predictions</b><br/>7 cột<br/>id, user_id,<br/>task_id, filename,<br/>file_path, status"]
        
        PP["<b>prediction_patient_info</b><br/>6 cột"]
        
        PR["<b>prediction_results</b><br/>10 cột"]
        
        PA["<b>prediction_analysis</b><br/>11 cột"]
        
        PD["<b>prediction_doctor_review</b><br/>4 cột"]
        
        PL["<b>prediction_processing_log</b><br/>4 cột"]
        
        U2 -->|"1:1"| UP
        U2 -->|"1:1"| UL
        U2 -->|"1:∞"| P2
        P2 -->|"1:1"| PP
        P2 -->|"1:1"| PR
        P2 -->|"1:1"| PA
        P2 -->|"1:1"| PD
        P2 -->|"1:1"| PL
    end
    
    style TRƯỚC fill:#ffebee,stroke:#c62828,stroke-width:3px,color:#000
    style SAU fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000
    style U1 fill:#ffcdd2,stroke:#c62828,stroke-width:2px,color:#000
    style P1 fill:#ffcdd2,stroke:#c62828,stroke-width:2px,color:#000
    style U2 fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px,color:#000
    style UP fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px,color:#000
    style UL fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px,color:#000
    style P2 fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px,color:#000
    style PP fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px,color:#000
    style PR fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px,color:#000
    style PA fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px,color:#000
    style PD fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px,color:#000
    style PL fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px,color:#000
```

---

## 📊 Sơ Đồ 3: Data Flow - Truy Vấn Dữ Liệu Chi Tiết

```mermaid
graph LR
    API["🔌 API<br/>GET /predictions/1"]
    
    Helper["📚 Helper<br/>get_prediction_full<br/>db, prediction_id"]
    
    DB["🗄️ Database"]
    
    API -->|"gọi"| Helper
    
    Helper -->|"Query 1"| DB
    
    subgraph QUERIES["Queries từ Database"]
        Q1["SELECT * FROM<br/>predictions<br/>WHERE id = 1"]
        Q2["SELECT * FROM<br/>prediction_patient_info<br/>WHERE prediction_id = 1"]
        Q3["SELECT * FROM<br/>prediction_results<br/>WHERE prediction_id = 1"]
        Q4["SELECT * FROM<br/>prediction_analysis<br/>WHERE prediction_id = 1"]
        Q5["SELECT * FROM<br/>prediction_doctor_review<br/>WHERE prediction_id = 1"]
        Q6["SELECT * FROM<br/>prediction_processing_log<br/>WHERE prediction_id = 1"]
    end
    
    DB -->|"joinedload"| Q1
    DB -->|"joinedload"| Q2
    DB -->|"joinedload"| Q3
    DB -->|"joinedload"| Q4
    DB -->|"joinedload"| Q5
    DB -->|"joinedload"| Q6
    
    subgraph RESULTS["Kết Quả"]
        R1["Prediction Object"]
        R2["PatientInfo Object"]
        R3["Results Object"]
        R4["Analysis Object"]
        R5["DoctorReview Object"]
        R6["ProcessingLog Object"]
    end
    
    Q1 --> R1
    Q2 --> R2
    Q3 --> R3
    Q4 --> R4
    Q5 --> R5
    Q6 --> R6
    
    DTO["📦 DTO<br/>PredictionDetailDTO"]
    
    R1 -->|"tạo"| DTO
    R2 -->|"combine"| DTO
    R3 -->|"combine"| DTO
    R4 -->|"combine"| DTO
    R5 -->|"combine"| DTO
    R6 -->|"combine"| DTO
    
    RESPONSE["✅ Response<br/>{<br/>  id, patient,<br/>  results,<br/>  analysis,<br/>  doctor_review,<br/>  processing<br/>}"]
    
    DTO -->|"to_dict()"| RESPONSE
    
    RESPONSE -->|"trả về JSON"| API
    
    style API fill:#2196F3,stroke:#1565c0,stroke-width:2px,color:#fff
    style Helper fill:#4CAF50,stroke:#2e7d32,stroke-width:2px,color:#fff
    style DB fill:#ff9800,stroke:#e65100,stroke-width:2px,color:#fff
    style DTO fill:#9C27B0,stroke:#6a1b9a,stroke-width:2px,color:#fff
    style RESPONSE fill:#2196F3,stroke:#1565c0,stroke-width:2px,color:#fff
    style QUERIES fill:#FFF9C4,stroke:#F57F17,stroke-width:1px
    style RESULTS fill:#C8E6C9,stroke:#2e7d32,stroke-width:1px
```

---

## 🔍 Hướng Dẫn Sử Dụng

### Xem trên GitHub
- Tất cả các sơ đồ Mermaid sẽ tự động render trên GitHub

### Xem trên Obsidian / Notion
- Copy paste markdown code vào các ứng dụng này để render

### Chuyển đổi sang PNG/SVG
Sử dụng [Mermaid CLI](https://mermaid.js.org/syntax/graph.html):

```bash
# Cài đặt
npm install -g @mermaid-js/mermaid-cli

# Chuyển đổi
mmdc -i diagrams.md -o diagrams.pdf
```

### Hoặc sử dụng Mermaid Live
- Truy cập: https://mermaid.live
- Paste Mermaid code để render

---

## 📝 Ghi Chú

- **PK**: Primary Key
- **FK**: Foreign Key
- **UK**: Unique Key
- **1:∞**: Một-Nhiều
- **1:1**: Một-Một

---

Generated: 2026-05-06
