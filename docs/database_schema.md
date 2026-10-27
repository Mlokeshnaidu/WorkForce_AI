# WorkForce AI Pro — Enterprise Database Schema Documentation

## Database Overview
* **Database Engine**: MySQL 8.0+ / PyMySQL
* **ORM Architecture**: SQLAlchemy Declarative Base
* **Charset / Collation**: `utf8mb4 / utf8mb4_unicode_ci`
* **Connection URL**: `mysql+pymysql://<user>:<password>@<host>:3306/workforce_ai_db`
* **Total Tables**: 16 Enterprise Tables

---

## Entity Relationship Overview

```
                      +------------------+
                      |      users       |
                      +--------+---------+
                               | 1
                               |
               +---------------+---------------+---------------+
               | 1                             | 1             | 1
        +------+-------+               +-------+------+ +------+-------+
        |  employees   |               | audit_logs   | |  chat_msgs   |
        +------+-------+               +--------------+ +--------------+
               | 1
      +--------+--------+--------+--------+--------+--------+
      | 1      | 1      | 1      | 1      | 1      | 1      | 1
+-----+----+ +-+-+--+ +-+---+  +-+--+   +-+---+  +-+----+ +-+-+---+
|attendance| |leaves| |payroll||documents||tasks||reviews||interv |
+----------+ +------+ +-----+  +----+   +-----+  +------+ +-------+
```

---

## Detailed Table Specifications

### 1. `users`
Stores authenticated users with Role-Based Access Control (RBAC).
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Unique User Identifier |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL, INDEX | Login email address |
| `hashed_password` | `VARCHAR(255)` | NOT NULL | Bcrypt hashed credential |
| `full_name` | `VARCHAR(100)` | NOT NULL | User display name |
| `role` | `ENUM('ADMIN','HR','MANAGER','EMPLOYEE')`| NOT NULL | RBAC role |
| `is_active` | `BOOLEAN` | DEFAULT TRUE | Active status |
| `created_at` | `DATETIME` | UTC Timestamp | Creation timestamp |

---

### 2. `departments`
Corporate business units and cost centers.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Department ID |
| `name` | `VARCHAR(100)` | UNIQUE, NOT NULL | Department Name (e.g., Engineering) |
| `code` | `VARCHAR(20)` | UNIQUE, NOT NULL | Short code (e.g., ENG) |
| `description` | `TEXT` | NULLABLE | Scope and responsibilities |
| `budget` | `FLOAT` | DEFAULT 0.0 | Annual operating budget (₹ INR) |
| `created_at` | `DATETIME` | UTC Timestamp | Creation timestamp |

---

### 3. `employees`
Core employee directory coupled with AI attrition prediction telemetry.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Unique Employee ID |
| `user_id` | `INT` | FOREIGN KEY (`users.id`), NULLABLE | Linked user account |
| `first_name` | `VARCHAR(50)` | NOT NULL | First name |
| `last_name` | `VARCHAR(50)` | NOT NULL | Last name |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL, INDEX | Professional contact email |
| `phone` | `VARCHAR(50)` | NULLABLE | Contact telephone |
| `job_title` | `VARCHAR(100)` | NOT NULL | Role / Designation |
| `salary` | `FLOAT` | NOT NULL | Annual gross salary (₹ INR) |
| `department_id` | `INT` | FOREIGN KEY (`departments.id`) | Assigned department |
| `status` | `VARCHAR(20)` | DEFAULT 'ACTIVE' | ACTIVE, ON_LEAVE, TERMINATED |
| `hire_date` | `DATE` | NULLABLE | Employment start date |
| `current_risk_score` | `FLOAT` | DEFAULT 0.15 | AI Attrition Probability (0.0 to 1.0) |
| `risk_level` | `VARCHAR(20)` | DEFAULT 'LOW' | LOW (&lt;0.35), MEDIUM (0.35-0.65), HIGH (&ge;0.65) |
| `satisfaction_level` | `FLOAT` | DEFAULT 0.70 | Employee satisfaction index (0.0 to 1.0) |
| `last_evaluation` | `FLOAT` | DEFAULT 0.75 | Performance evaluation score (0.0 to 1.0) |
| `number_of_projects` | `INT` | DEFAULT 3 | Active concurrent project count |
| `average_monthly_hours`| `INT` | DEFAULT 180 | Monthly workload hours |
| `time_spent_company` | `INT` | DEFAULT 3 | Company tenure (Years) |
| `work_accident` | `INT` | DEFAULT 0 | Recorded safety incidents (0 or 1) |
| `promotion_last_5years`| `INT` | DEFAULT 0 | Promotional advancement flag (0 or 1) |
| `created_at` | `DATETIME` | UTC Timestamp | Record creation timestamp |

---

### 4. `attendance`
Clock-in/out telemetry, shift classifications, and overtime hours.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Attendance record ID |
| `employee_id` | `INT` | FOREIGN KEY (`employees.id`) | Target employee |
| `date` | `DATE` | NOT NULL, INDEX | Attendance calendar date |
| `check_in` | `DATETIME` | NULLABLE | Timestamp of arrival |
| `check_out` | `DATETIME` | NULLABLE | Timestamp of departure |
| `shift_type` | `ENUM('MORNING','EVENING','NIGHT','REMOTE')` | DEFAULT 'MORNING' | Assigned work shift |
| `status` | `ENUM('PRESENT','ABSENT','HALF_DAY','ON_LEAVE')` | DEFAULT 'PRESENT' | Daily status |
| `work_hours` | `FLOAT` | DEFAULT 0.0 | Net productive work hours |
| `overtime_hours` | `FLOAT` | DEFAULT 0.0 | Hours beyond scheduled duration |

---

### 5. `leaves`
Paid time-off (PTO), sick leaves, and manager approval workflows.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Leave request ID |
| `employee_id` | `INT` | FOREIGN KEY (`employees.id`) | Requesting employee |
| `leave_type` | `ENUM('SICK','CASUAL','ANNUAL','MATERNITY','EMERGENCY')` | NOT NULL | Category of leave |
| `start_date` | `DATE` | NOT NULL | First day of leave |
| `end_date` | `DATE` | NOT NULL | Last day of leave |
| `days_count` | `INT` | DEFAULT 1 | Total working days requested |
| `reason` | `TEXT` | NULLABLE | Justification / notes |
| `status` | `ENUM('PENDING','APPROVED','REJECTED')` | DEFAULT 'PENDING' | Workflow approval state |
| `reviewed_by` | `INT` | FOREIGN KEY (`users.id`), NULLABLE | Approver user ID |
| `created_at` | `DATETIME` | UTC Timestamp | Submission timestamp |

---

### 6. `payrolls`
Salary disbursements, tax withholdings, and compensation ledgers.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Payroll entry ID |
| `employee_id` | `INT` | FOREIGN KEY (`employees.id`) | Target employee |
| `month` | `INT` | NOT NULL (1 to 12) | Pay cycle month |
| `year` | `INT` | NOT NULL (e.g. 2026) | Pay cycle year |
| `basic_salary` | `FLOAT` | NOT NULL | Contractual base salary (₹ INR) |
| `allowances` | `FLOAT` | DEFAULT 0.0 | Stipends / bonuses |
| `deductions` | `FLOAT` | DEFAULT 0.0 | Tax withholdings and benefits |
| `net_salary` | `FLOAT` | NOT NULL | Payout amount |
| `status` | `ENUM('PENDING','PROCESSING','PAID','FAILED')` | DEFAULT 'PENDING' | Payout disbursement state |
| `payment_date` | `DATE` | NULLABLE | Settlement date |

---

### 7. `interventions`
Prescriptive retention action plans (Modules 18 & 21).
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Intervention ID |
| `employee_id` | `INT` | FOREIGN KEY (`employees.id`) | Target employee |
| `created_by` | `INT` | FOREIGN KEY (`users.id`) | Initiating HR user |
| `strategy_type`| `VARCHAR(100)` | NOT NULL | WORKLOAD_REDUCTION, SALARY_INCREMENT, etc. |
| `title` | `VARCHAR(200)` | NOT NULL | Plan summary |
| `description` | `TEXT` | NULLABLE | Detailed operational tasks |
| `initial_risk_score` | `FLOAT` | NOT NULL | Pre-intervention flight risk |
| `target_risk_score` | `FLOAT` | DEFAULT 0.20 | Target post-intervention risk |
| `current_risk_score` | `FLOAT` | NULLABLE | Real-time transitioned risk |
| `cost_budget` | `FLOAT` | DEFAULT 0.0 | Financial allocation (₹ INR) |
| `status` | `ENUM('PLANNED','IN_PROGRESS','SUCCESSFUL','FAILED','CANCELLED')` | DEFAULT 'PLANNED' | Lifecycle status |
| `outcome_notes`| `TEXT` | NULLABLE | Final retention results |

---

### 8. `tasks`
Workforce operational checklists and retention workflows (Module 20).
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Task ID |
| `title` | `VARCHAR(200)` | NOT NULL | Task title |
| `description` | `TEXT` | NULLABLE | Execution instructions |
| `category` | `VARCHAR(100)` | DEFAULT 'HR_OPERATION' | RETENTION, ONBOARDING, OFFBOARDING |
| `priority` | `ENUM('LOW','MEDIUM','HIGH','CRITICAL')` | DEFAULT 'MEDIUM' | Urgency tier |
| `status` | `ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED')` | DEFAULT 'PENDING' | Completion state |
| `assigned_to` | `INT` | FOREIGN KEY (`users.id`) | Task assignee |
| `due_date` | `DATETIME` | NULLABLE | Target completion deadline |

---

### 9. `performance_reviews`
Formal quarterly and annual appraisals (Module 22).
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Review ID |
| `employee_id` | `INT` | FOREIGN KEY (`employees.id`) | Evaluated employee |
| `reviewer_id` | `INT` | FOREIGN KEY (`users.id`) | Evaluating manager |
| `review_period`| `VARCHAR(50)` | NOT NULL | Review cycle (e.g., Q1 2026) |
| `rating` | `FLOAT` | NOT NULL (1.0 to 5.0) | Numerical appraisal score |
| `goals_met_percent` | `FLOAT` | DEFAULT 100.0 | KPI delivery attainment |
| `strengths` | `TEXT` | NULLABLE | Core demonstrated competencies |
| `areas_for_improvement` | `TEXT` | NULLABLE | Development coaching roadmap |

---

### 10. `audit_logs`
Immutable compliance and security audit trail (Module 27).
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Audit log ID |
| `user_id` | `INT` | FOREIGN KEY (`users.id`), NULLABLE | Actor user ID |
| `action` | `VARCHAR(100)` | NOT NULL | LOGIN, CREATE, UPDATE, RETRAIN, EXPORT |
| `entity` | `VARCHAR(100)` | NOT NULL | Target entity type |
| `entity_id` | `VARCHAR(100)` | NULLABLE | Affected entity record ID |
| `details` | `TEXT` | NULLABLE | Human-readable event description |
| `ip_address` | `VARCHAR(50)` | NULLABLE | Client IP address |
| `created_at` | `DATETIME` | UTC Timestamp, INDEX | Occurrence timestamp |

---

### 11. `ml_models`
Scikit-Learn model artifacts, versions, and hyperparameter metrics (Module 12).
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Model artifact ID |
| `model_name` | `VARCHAR(100)` | NOT NULL | Classifier designation |
| `version` | `VARCHAR(50)` | DEFAULT 'v1.0.0' | Artifact release tag |
| `algorithm` | `VARCHAR(100)` | DEFAULT 'RandomForestClassifier' | ML algorithm (120 Trees) |
| `accuracy` | `FLOAT` | NOT NULL | Test accuracy score |
| `precision_score` | `FLOAT` | NOT NULL | Positive predictive value |
| `recall_score` | `FLOAT` | NOT NULL | Sensitivity / True Positive rate |
| `f1_score` | `FLOAT` | NOT NULL | Balanced harmonic mean |
| `roc_auc` | `FLOAT` | NOT NULL | Area under ROC curve |
| `feature_importances` | `JSON` | NULLABLE | Gini importance weights per feature |
| `is_active` | `BOOLEAN` | DEFAULT TRUE | Active inference model flag |

---

### 12. `datasets`
Uploaded HR workforce datasets and CSV previews (Module 11).
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT | Dataset ID |
| `filename` | `VARCHAR(255)` | NOT NULL | Original CSV filename |
| `file_path` | `VARCHAR(500)` | NULLABLE | Filesystem storage path |
| `row_count` | `INT` | DEFAULT 0 | Ingested sample count |
| `features_count`| `INT` | DEFAULT 0 | Total feature columns |
| `status` | `VARCHAR(50)` | DEFAULT 'PROCESSED' | PROCESSED, TRAINED, FAILED |
| `preview_data` | `JSON` | NULLABLE | First 8 rows JSON preview |
| `uploaded_by` | `INT` | FOREIGN KEY (`users.id`) | Uploader ID |
