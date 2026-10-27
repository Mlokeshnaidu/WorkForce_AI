# WorkForce AI Pro – HR Attrition Prediction & Workforce Intelligence Platform

WorkForce AI Pro is an enterprise-grade full-stack workforce intelligence and HR management platform designed to predict employee attrition risk, automate retention workflows, and monitor operational HR telemetry in real time.

The platform integrates a high-performance **FastAPI** backend with **MySQL** relational persistence, a **Scikit-Learn** 120-tree Random Forest inference engine, and a **React (Vite)** corporate interface styled with **Tailwind CSS**.

---

## Technical Architecture

```mermaid
graph TD
    subgraph Frontend [React + Vite Frontend (Port 5173)]
        UI[Corporate SPA Interface]
        State[Axios Client & Auth Token]
        Dashboards[Workforce Dashboards & Visualizations]
    end

    subgraph Backend [FastAPI Backend (Port 8000)]
        API[REST API Gateway /api/v1]
        Auth[JWT Authentication & RBAC]
        Services[Business Logic & Telemetry Aggregator]
        ML[Scikit-Learn Random Forest Engine]
    end

    subgraph DataStore [MySQL Database (Port 3306)]
        DB[(workforce_ai_db)]
        Tables[15 Relational Tables & Foreign Keys]
    end

    UI -->|HTTP Requests with JWT Bearer Token| API
    API --> Auth
    Auth --> Services
    Services --> DB
    Services --> ML
    ML -->|Risk Scoring & Attribution Factors| Services
    Services -->|JSON Payloads| State
    State --> Dashboards
```

---

## Technology Stack

### Backend
* **Runtime**: Python 3.12
* **Framework**: FastAPI (Async ASGI)
* **Web Server**: Uvicorn
* **ORM & Database**: SQLAlchemy 2.0 with PyMySQL connector
* **Authentication**: JWT (JSON Web Tokens) with HS256 algorithm and bcrypt password hashing
* **Data Validation**: Pydantic v2 & Pydantic-Settings

### AI & Machine Learning Pipeline
* **Machine Learning Library**: Scikit-Learn 1.5.2
* **Algorithm**: Random Forest Classifier (120 Estimators, Gini criterion)
* **Data Processing**: Pandas 2.2.3 & NumPy 2.1.2
* **Model Capabilities**:
  * Individual Flight Risk Probability (0.0% to 100.0%)
  * Inference Confidence Scoring
  * Key Behavioral Risk Signals Extraction
  * Prescriptive Retention Action Recommendations
  * 6-Month Headcount & Attrition Retention Forecasting
  * Live Dataset Ingestion (CSV) & Schema Parsing

### Frontend
* **Core**: React 18 with Vite build tooling
* **Styling**: Vanilla CSS and Tailwind CSS (Dark Corporate Slate Theme)
* **Data Visualization**: Recharts (Predictive Headcount Curves)
* **Icons**: Lucide React
* **HTTP Client**: Axios with central JWT interceptors

### Database
* **Engine**: MySQL 8.0+
* **Database Name**: `workforce_ai_db`
* **Schema**: 15 Normalized relational tables with strict foreign key constraints and cascade rules

---

## 30-Module Coverage Matrix

The platform implements all 30 enterprise modules across 3 phases:

### Phase 1: Core Workforce Management System
* **Module 1: Authentication & Authorization System** - JWT token generation, password encryption, session validation, forgot password flow.
* **Module 2: Employee Management System** - Complete employee CRUD, search, risk filtering, and department assignments.
* **Module 3: Department & Role Management** - Department CRUD, headcount tracking, average compensation analytics, and role mapping.
* **Module 4: Attendance & Shift Management** - Terminal punch clock (check-in/check-out), shift types (Morning, Evening, Night, Remote), work hour logs, overtime tracking.
* **Module 5: Leave Management System** - Leave applications, balance entitlement tracking (Annual, Sick, Casual, Unpaid), approval workflows, history logging.
* **Module 6: Payroll Management System** - Monthly payroll generation, base salary, allowance calculations (+15%), tax deductions (12%), bonuses, payslip distribution.
* **Module 7: Notifications & Alerts System** - In-app notification center, unread counters, read receipts, event alerts.
* **Module 8: One-to-One Communication & Chat** - Real-time employee-to-manager messaging, message history, colleague directory.
* **Module 9: Document Management System** - Multi-category file upload (Contracts, Resumes, ID Proofs, Appraisals), download, and deletion APIs.
* **Module 10: Dashboard & Workforce Analytics** - High-level KPIs, attendance rates, payroll summaries, and department headcounts.

### Phase 2: HR Attrition Prediction & AI Intelligence
* **Module 11: Dataset Management System** - CSV telemetry ingestion (IBM HR & Kaggle schemas), duplicate validation, dataset versioning.
* **Module 12: AI Attrition Prediction Engine** - Random Forest risk probability scoring, confidence calculation, fleet risk recalculation.
* **Module 13: Employee Risk Monitoring System** - High-risk employee detection, real-time risk alerts, monitoring logs.
* **Module 14: Workforce Forecasting System** - 6-month projected retained headcount curves, cumulative turnover projections.
* **Module 15: Attrition Analytics Dashboard** - Department-wise flight risk breakdown, organization stability scoring.
* **Module 16: HR Intervention & Decision Support System** - Prescriptive retention plans and intervention follow-up tracking.
* **Module 17: Smart Notification & Alert Engine** - Priority risk alerts triggered automatically upon employee telemetry updates.
* **Module 18: Real-Time Workforce Monitoring System** - Operational compliance stream, live activity logs, system events.

### Phase 3: Advanced Enterprise Features
* **Module 19: Reports & Export System** - CSV report generation for master roster, flight risk reports, payroll ledgers, and audit logs.
* **Module 20: Audit Logs & Activity Tracking** - Immutable security audit trail with client IP addresses, entity changes, and timestamps.
* **Module 21: Workflow & Task Management** - Retention checklists, onboarding/offboarding tasks, priority badges, completion checkboxes.
* **Module 22: Performance Review System** - Manager appraisals, star ratings (1.0 to 5.0), strengths/development feedback, goal achievement tracking.
* **Module 23: AI Recommendation Engine** - Automated retention actions tailored to detected employee behavioral indicators.
* **Module 24: Advanced Search & Filtering System** - Multi-parameter search across departments, roles, and risk levels.
* **Module 25: Professional Enterprise UI/UX System** - Minimalist, calm corporate dark styling without visual noise or academic tags.
* **Module 26: Role-Based Access Control (RBAC)** - Enforced roles: `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`.
* **Module 27: Workforce Stability Engine** - Quantitative workforce stability index calculation (0% to 100%).
* **Module 28: System Optimization & Scalability** - Query indexing, CORS security headers, Vite bundle minification.
* **Module 29: Testing & Validation** - Automated test suite covering 20 core workflows and validation suites.
* **Module 30: Frontend & Backend Integration** - End-to-end synchronized state management connecting Vite on port 5173 to FastAPI on port 8000.

---

## Role-Based Access Control (RBAC) Demo Accounts

The platform includes 4 pre-configured enterprise accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@workforce.ai` | `Admin@123` | Full system access, ML retrain, system audits, user management |
| **HR Director** | `hr@workforce.ai` | `Hr@123` | Employee management, payroll runs, leaves, interventions, reviews |
| **Manager** | `manager@workforce.ai` | `Manager@123` | Team oversight, attendance tracking, appraisals, task management |
| **Employee** | `employee@workforce.ai` | `Employee@123` | Self profile, leave requests, attendance check-in, direct chat |

---

## Database Architecture

The MySQL database (`workforce_ai_db`) contains 15 relational tables:

1. `users` - Authentication credentials, roles, and password hashes
2. `departments` - Organizational business units and budget metadata
3. `employees` - Core workforce directory, salary, tenure, and flight risk scores
4. `attendance_records` - Clock-in/out timestamps, shift types, and overtime hours
5. `leave_applications` - Time-off requests, balances, and approval states
6. `payrolls` - Monthly compensation records, allowances, and tax deductions
7. `notifications` - In-app notifications and alert delivery history
8. `chat_messages` - One-to-one message history and audit trails
9. `documents` - File metadata, categories, and disk storage paths
10. `datasets` - Ingested CSV telemetry records and row counts
11. `ml_models` - Machine learning model versions, accuracy, and training dates
12. `interventions` - Retention workflows, budgets, and post-intervention risk delta
13. `tasks` - Operational HR workflows, assignments, and due dates
14. `performance_reviews` - Appraisals, ratings, strengths, and goals
15. `audit_logs` - Compliance ledger tracking user actions and IP addresses

---

## Installation & Setup Guide

### Prerequisites
* Python 3.10+ (Recommended: Python 3.12)
* Node.js 18+ & npm
* MySQL Server 8.0+ running locally on port 3306

### 1. Database Configuration
Ensure MySQL is running and create the database:
```sql
CREATE DATABASE IF NOT EXISTS workforce_ai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment variables in backend/.env
# Example DATABASE_URL:
# DATABASE_URL="mysql+pymysql://root:password@localhost:3306/workforce_ai_db"

# Seed initial database records
python seed.py

# Start FastAPI development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API will be live at: `http://localhost:8000`  
Interactive Swagger documentation: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend application will be live at: `http://localhost:5173`

---

## Running Automated Tests

The backend includes a comprehensive 20-suite automated test runner verifying all 30 modules:

```bash
cd backend
.\venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py" -v
```

Expected result:
```text
Ran 20 tests in 0.726s
OK
```

---

## Production Build Verification

To verify frontend compilation for production deployment:
```bash
cd frontend
npm run build
```
Build bundle will be generated under `frontend/dist/` with zero errors.

---

## Deliverables & Documentation Index

* **API Documentation**: [`docs/api_documentation.md`](file:///c:/Users/manda/OneDrive/Desktop/ai%20saas%20backend%20training/WORKFORCE%20AI%20PRO%20%E2%80%93%20HR%20ATTRITION%20PREDICTION%20&%20WORKFORCE%20INTELLIGENCE%20PLATFORM/docs/api_documentation.md)
* **Database Schema**: [`docs/database_schema.md`](file:///c:/Users/manda/OneDrive/Desktop/ai%20saas%20backend%20training/WORKFORCE%20AI%20PRO%20%E2%80%93%20HR%20ATTRITION%20PREDICTION%20&%20WORKFORCE%20INTELLIGENCE%20PLATFORM/docs/database_schema.md)
* **Backend Source Code**: [`backend/app/`](file:///c:/Users/manda/OneDrive/Desktop/ai%20saas%20backend%20training/WORKFORCE%20AI%20PRO%20%E2%80%93%20HR%20ATTRITION%20PREDICTION%20&%20WORKFORCE%20INTELLIGENCE%20PLATFORM/backend/app/)
* **Frontend Source Code**: [`frontend/src/`](file:///c:/Users/manda/OneDrive/Desktop/ai%20saas%20backend%20training/WORKFORCE%20AI%20PRO%20%E2%80%93%20HR%20ATTRITION%20PREDICTION%20&%20WORKFORCE%20INTELLIGENCE%20PLATFORM/frontend/src/)
* **Test Suites**: [`backend/tests/`](file:///c:/Users/manda/OneDrive/Desktop/ai%20saas%20backend%20training/WORKFORCE%20AI%20PRO%20%E2%80%93%20HR%20ATTRITION%20PREDICTION%20&%20WORKFORCE%20INTELLIGENCE%20PLATFORM/backend/tests/)

---

## License & Attribution
Designed and built for enterprise workforce telemetry analysis, employee retention intelligence, and full-stack AI SaaS training.
