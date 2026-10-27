# WorkForce AI Pro - Backend Architecture & API Specification

High-performance enterprise HR Attrition Prediction & Workforce Intelligence REST API engine built with FastAPI, SQLAlchemy ORM, MySQL, and Scikit-Learn.

---

## 1. Technology Stack

- **Runtime**: Python 3.12
- **Web Framework**: FastAPI (ASGI)
- **Database ORM**: SQLAlchemy 2.0 with PyMySQL driver
- **Database Engine**: MySQL Server 8.0+ (`workforce_ai_db`)
- **Machine Learning**: Scikit-Learn (`RandomForestClassifier`, 120 Estimators, balanced class weights)
- **Authentication**: OAuth2 Password Bearer with JWT (HS256) & Bcrypt password hashing
- **Testing**: Python standard `unittest` test suite with `httpx` / Starlette `TestClient`

---

## 2. Directory Structure

```text
backend/
├── app/
│   ├── core/
│   │   ├── config.py         # Pydantic BaseSettings, environment variables
│   │   ├── database.py       # SQLAlchemy engine, session maker, get_db() generator
│   │   ├── deps.py           # Dependency injection: get_current_user, require_roles
│   │   └── security.py       # Bcrypt hash verify & JWT access token encoding/decoding
│   ├── ml/
│   │   ├── trainer.py        # Scikit-Learn training pipeline, metrics, CSV dataset generator
│   │   ├── predictor.py      # Real-time inference engine, factor diagnostics & prescriptive actions
│   │   ├── attrition_model.pkl # Serialized 2.48 MB trained Random Forest artifact
│   │   └── hr_attrition_dataset.csv # 1,600-record benchmark dataset
│   ├── models/               # 15 SQLAlchemy ORM models (16 MySQL tables)
│   ├── routes/               # 15 FastAPI routers mounted under /api/v1
│   ├── schemas/              # Pydantic validation schemas (request/response models)
│   └── main.py               # Application entrypoint, CORS middleware, lifespan events
├── tests/
│   └── test_all_modules.py   # Automated 20-suite test runner covering all 30 modules
├── .env                      # Database credentials and JWT secrets
├── requirements.txt          # Python dependency manifests
└── seed_data.py              # Initial database seeder (4 users, 8 employees, 5 departments)
```

---

## 3. Database Schema (16 MySQL Tables)

| Table Name | Primary Purpose | Key Fields |
| :--- | :--- | :--- |
| `users` | User accounts & RBAC | `id`, `email`, `hashed_password`, `role`, `is_active` |
| `employees` | Active workforce profiles | `id`, `first_name`, `last_name`, `salary`, `current_risk_score`, `risk_level` |
| `departments` | Organizational units | `id`, `name`, `code`, `description` |
| `attendance` | Time punches & shifts | `id`, `employee_id`, `date`, `check_in`, `check_out`, `shift_type`, `overtime_hours` |
| `leaves` | Leave applications | `id`, `employee_id`, `leave_type`, `start_date`, `end_date`, `status` |
| `payrolls` | Compensation & tax | `id`, `employee_id`, `base_salary`, `allowances`, `bonuses`, `tax_deductions`, `net_salary` |
| `documents` | Secure document vault | `id`, `employee_id`, `title`, `document_type`, `file_name`, `file_url`, `file_size_kb` |
| `chat_messages` | Team communication | `id`, `sender_id`, `receiver_id`, `message`, `created_at` |
| `notifications` | System notifications | `id`, `user_id`, `title`, `message`, `type`, `is_read` |
| `datasets` | Ingested ML datasets | `id`, `file_name`, `row_count`, `features_count`, `uploaded_at` |
| `ml_models` | Model versioning registry| `id`, `version`, `algorithm`, `accuracy`, `precision`, `recall`, `f1_score`, `is_active` |
| `risk_assessment_logs` | Audit trail of predictions | `id`, `employee_id`, `risk_score`, `risk_level`, `top_factors`, `recommendations` |
| `interventions` | Retention action plans | `id`, `employee_id`, `strategy_type`, `status`, `target_risk_reduction` |
| `tasks` | Assigned workflows | `id`, `title`, `assigned_to`, `priority`, `status`, `due_date` |
| `performance_reviews` | Formal appraisals | `id`, `employee_id`, `reviewer_id`, `rating`, `review_cycle`, `feedback` |
| `audit_logs` | Security audit trail | `id`, `user_id`, `action`, `resource`, `ip_address`, `created_at` |

---

## 4. Machine Learning Engine

- **Model Type**: Random Forest Classifier (`n_estimators=120`, `max_depth=10`, `class_weight='balanced'`)
- **Telemetry Inputs**:
  - `satisfaction_level` (0.0 to 1.0)
  - `last_evaluation` (0.0 to 1.0)
  - `number_of_projects` (Integer count)
  - `average_monthly_hours` (Monthly workload hours)
  - `time_spent_company` (Tenure in years)
  - `work_accident` (Binary indicator)
  - `promotion_last_5years` (Binary indicator)
  - `salary_level` (0=Low, 1=Medium, 2=High)
- **Output Metrics**:
  - Flight Risk Probability (0.0% to 100.0%)
  - Risk Level Classification (`LOW`, `MEDIUM`, `HIGH`)
  - Confidence Score (Statistical decision margin)
  - Top 3 Behavioral Drivers
  - Prescriptive Retention Actions

---

## 5. Verification Commands

Run unit tests from the project root:
```powershell
.\backend\venv\Scripts\python.exe backend/tests/test_all_modules.py
```

Run test suite via discover:
```powershell
.\backend\venv\Scripts\python.exe -m unittest discover -s backend/tests -p "test_all_modules.py"
```

Check API health:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health"
```
