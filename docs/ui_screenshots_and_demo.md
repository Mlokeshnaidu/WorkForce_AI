# WorkForce AI Pro — UI & System Demonstration Guide

This guide documents the enterprise user interface, dashboard workflows, live demonstration steps, and system architecture for **WorkForce AI Pro – HR Attrition Prediction & Workforce Intelligence Platform**.

---

## 1. Demo Credentials & Access

The platform includes seed users with granular Role-Based Access Control (RBAC):

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Admin** | `admin@workforce.ai` | `admin123` | Unrestricted full access across all 30 modules, system configuration, audit logs, models |
| **HR Specialist** | `hr@workforce.ai` | `hr123` | Employee directory, payroll processing, leaves, documents, interventions, reports |
| **Manager** | `manager@workforce.ai` | `manager123` | Department employees, attendance monitoring, task assignment, review workflows |
| **Employee** | `employee@workforce.ai` | `emp123` | Self-service attendance clock-in, leave application, payslip download, 1:1 chat |

- **Frontend Application URL**: `http://localhost:5173`
- **Backend API Documentation (Swagger)**: `http://localhost:8000/docs`
- **Backend ReDoc**: `http://localhost:8000/redoc`

---

## 2. Key Workflow Demonstrations

### Flow 1: End-to-End AI Attrition Prediction & Intervention Workflow
```
[Employee Activity / Attendance]
              ↓
[AI Machine Learning Engine (Random Forest / Logistic Regression)]
              ↓ Recalculates Risk Score (0 - 100%)
[High Risk Threshold Exceeded (> 70%)]
              ↓
[Automated HR Notification & Audit Log Triggered]
              ↓
[Intervention Workflow Action Created (Salary Review, Role Switch, Mentorship)]
              ↓
[Task Assigned to Manager & Follow-Up Scheduled]
```

1. Navigate to **AI Attrition Engine** (`/attrition`).
2. Select any active employee or trigger **Recalculate All AI Risk Scores**.
3. Inspect the **Risk Score**, **Confidence Level**, and **Top Risk Drivers** (e.g., Low Salary Satisfaction, High Overtime, Years Since Last Promotion).
4. Click **"Initiate Intervention"** on any high-risk employee.
5. In **Intervention Workflows** (`/interventions`), track progress: `SCHEDULED` → `IN_PROGRESS` → `RESOLVED`.
6. Assign follow-up tasks in **Task Workflows** (`/tasks`).

---

### Flow 2: Indian Rupee (₹) Payroll & One-Click PDF Payslip
1. Navigate to **Payroll Management** (`/payroll`).
2. Notice all metrics are denominated in **Indian Rupees (₹ INR)**:
   - Monthly Payroll Budget (₹)
   - Base Salaries (₹)
   - Allowances & Bonuses (+₹)
   - Tax / Provident Fund Deductions (-₹)
   - Net Disbursed Compensation (₹)
3. Click **"Generate Monthly Payroll"** for current cycle.
4. Click the **"View"** button to preview payslip breakdown modal.
5. Click **"PDF Payslip"** to immediately stream a formatted PDF payslip generated server-side using ReportLab.

---

### Flow 3: Comprehensive Multi-Format Reports & Analytics Export
1. Navigate to **Reports & Exports** (`/reports`).
2. Choose from 5 core analytical domains:
   - **Employee Master Directory**
   - **AI Attrition Risk Assessment**
   - **Payroll & Compensation Register**
   - **Attendance & Punctuality Records**
   - **System Audit Trail & Security Logs**
3. Select your desired format:
   - **CSV**: Lightweight data pipeline ingestion
   - **Excel (`.xlsx`)**: Styled multi-column spreadsheet with headers using `openpyxl`
   - **PDF**: Formal executive printable summary

---

### Flow 4: Dataset Upload, Validation & Model Training
1. Navigate to **Dataset Management** (`/datasets`).
2. Drag and drop an HR attrition CSV (e.g., IBM HR analytics dataset or custom CSV).
3. System automatically validates:
   - Total rows & column integrity
   - Incomplete / null records count
   - Duplicate records identification
   - Valid records ready for model ingestion
4. Click **"Train Model"** to retrain the Random Forest classifier in real-time.
5. Check accuracy, precision, recall, and ROC-AUC metrics updated dynamically.

---

### Flow 5: Real-Time Communication & Document Vault
1. Navigate to **1:1 Chat** (`/chat`).
2. Select any colleague or manager.
3. Messages update with auto-polling synchronization every 3.5 seconds.
4. Navigate to **Document Vault** (`/documents`).
5. Filter by `CONTRACT`, `RESUME`, `ID_PROOF`, or `PERFORMANCE`.
6. Click **"Download"** to securely retrieve verified files via authenticated endpoints.

---

## 3. Visual Layout Architecture

```
+-----------------------------------------------------------------------------------------+
| WORKFORCE AI PRO (v1.0.0)                                     [Notification 🔔] [Admin] |
+-----------------------+-----------------------------------------------------------------+
| NAVIGATION            | MAIN CONTENT VIEWPORT                                           |
|                       |                                                                 |
| 📊 Executive Overview | +------------------+ +------------------+ +------------------+ |
| 👥 Employee Directory | | Total Workforce  | | Attrition Risk   | | Monthly Payroll  | |
| 🧠 AI Attrition Model | | 150 Active       | | 14 High Risk     | | ₹1,42,80,000     | |
| 📈 Workforce Forecast | +------------------+ +------------------+ +------------------+ |
| 🛡️ Interventions      |                                                                 |
| 🕒 Attendance Tracker | [ Interactive Retention Trend & Department Risk Radar Charts ]  |
| 🏖️ Leave Management   |                                                                 |
| 🏢 Departments        | +-------------------------------------------------------------+ |
| 💰 Payroll (₹ INR)    | | REAL-TIME ATTRITION ALERTS & RECOMMENDED INTERVENTIONS       | |
| 💬 1-to-1 Chat        | | • Sarah Jenkins (Tech) - Risk 88% → Recommended: Retention   | |
| 📁 Document Vault     | | • Michael Chang (Sales) - Risk 79% → Recommended: Bonus      | |
| 🎯 Performance Reviews| +-------------------------------------------------------------+ |
| 📤 Reports & Export   |                                                                 |
| ⚙️ Dataset Hub        |                                                                 |
+-----------------------+-----------------------------------------------------------------+
```

---

## 4. UI Design System Principles Applied

- **Color Palette**: Dark Slate (`#0B0F17`, `#111827`, `#1E293B`) paired with high-contrast Indigo/Violet accents (`#6366F1`, `#8B5CF6`) and semantic badges (Emerald for Active/Low, Amber for Medium, Rose for High Risk).
- **Typography**: Clean modern sans-serif with tabular numeric formatting (`font-mono`, `toLocaleString('en-IN')`).
- **Currency Standard**: Indian Rupee (`₹` symbol, `IndianRupee` Lucide icon, `Rs.` for PDF fallback).
- **Glassmorphism**: Subtle translucent borders (`border-slate-800/80`), backdrop blur, and layered elevation cards.
