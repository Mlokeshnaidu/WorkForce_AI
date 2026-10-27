# WorkForce AI Pro — REST API Specification & Endpoint Directory

## Base URL
* **Development / Production API URL**: `http://localhost:8000/api/v1`
* **Swagger Interactive UI**: `http://localhost:8000/docs`
* **ReDoc Specification**: `http://localhost:8000/redoc`
* **Authentication Method**: JWT Bearer Token in `Authorization: Bearer <TOKEN>` header

---

## 1. Authentication & RBAC (`/api/v1/auth`)
| Method | Endpoint | Access | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | `{"email": "...", "password": "..."}` | JSON authentication returning JWT and user role |
| `POST` | `/auth/register` | Public / Admin | `UserCreate` schema | Registers new user account |
| `GET` | `/auth/me` | Authenticated | None | Returns profile of current user |
| `POST` | `/auth/forgot-password` | Public | `{"email": "..."}` | Generates password reset verification token |
| `POST` | `/auth/reset-password` | Public | `{"email": "...", "new_password": "..."}` | Updates password using reset token |

---

## 2. Employee Directory (`/api/v1/employees`)
| Method | Endpoint | Access | Request Body / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/employees/` | Authenticated | `?search=&department_id=&risk_level=` | Paginated employee roster with risk telemetry |
| `POST` | `/employees/` | Admin, HR | `EmployeeCreate` schema | Adds new employee and calculates baseline risk |
| `GET` | `/employees/{id}` | Authenticated | None | Detailed profile with risk factors and history |
| `PUT` | `/employees/{id}` | Admin, HR | `EmployeeUpdate` schema | Updates employee profile and recalculates risk |
| `DELETE` | `/employees/{id}` | Admin | None | Soft/hard deletes employee record |

---

## 3. Department Management (`/api/v1/departments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/departments/` | Authenticated | Lists all departments with employee counts and budget |
| `POST` | `/departments/` | Admin, HR | Creates new department and cost center |
| `PUT` | `/departments/{id}` | Admin, HR | Updates department name, code, description, or budget |
| `DELETE` | `/departments/{id}` | Admin | Deletes department (checks for active employees) |

---

## 4. Attendance & Shift Telemetry (`/api/v1/attendance`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/attendance/check-in` | Authenticated | Records employee check-in timestamp and shift type |
| `POST` | `/attendance/check-out` | Authenticated | Records check-out and computes net hours & overtime |
| `GET` | `/attendance/today/{emp_id}` | Authenticated | Retrieves current daily check-in status |
| `GET` | `/attendance/history` | Authenticated | Retrieves paginated attendance and calendar history |
| `GET` | `/attendance/stats/summary` | Authenticated | Returns organization-wide attendance & punctuality rates |

---

## 5. Leave Management Engine (`/api/v1/leaves`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/leaves/` | Authenticated | Submits new leave application (Sick, Annual, Casual) |
| `GET` | `/leaves/` | Authenticated | Lists leave applications filtered by employee or status |
| `PUT` | `/leaves/{id}/review` | Admin, HR, Manager | Approves or rejects pending leave request |
| `GET` | `/leaves/balances/{emp_id}` | Authenticated | Returns remaining annual/sick leave balances |

---

## 6. Payroll & Compensation (`/api/v1/payrolls`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/payrolls/generate` | Admin, HR | Generates monthly payroll batch with deductions & allowances |
| `GET` | `/payrolls/` | Authenticated | Lists payslips and compensation disbursements |
| `PUT` | `/payrolls/{id}/status` | Admin, HR | Updates payment status (PENDING, PROCESSING, PAID) |
| `GET` | `/payrolls/stats/summary`| Authenticated | Computes total organization payroll expenditure |

---

## 7. AI Attrition Prediction & Intelligence (`/api/v1/ai`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/ai/overview` | Authenticated | Workforce Stability Index, risk counts, and department averages |
| `POST` | `/ai/predict` | Authenticated | Evaluates custom 8-feature vector and returns probability |
| `POST` | `/ai/predict/{emp_id}` | Authenticated | Evaluates specific employee, updates DB, and logs assessment |
| `POST` | `/ai/recalculate-all` | Admin, HR | Batch recalculation across all active employees |
| `GET` | `/ai/forecast` | Authenticated | 6-Month predictive headcount retention & turnover curve |
| `GET` | `/ai/model-metrics` | Authenticated | Active Random Forest metrics (ROC-AUC, Accuracy, Features) |
| `GET` | `/ai/datasets` | Authenticated | Lists ingested CSV workforce datasets |
| `POST` | `/ai/datasets/upload` | Admin, HR | Uploads CSV dataset and parses preview |
| `GET` | `/ai/logs` | Authenticated | Returns historical AI risk evaluation logs |

---

## 8. Prescriptive Retention Interventions (`/api/v1/interventions`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/interventions/` | Authenticated | Lists retention initiatives filtered by status or employee |
| `POST` | `/interventions/` | Admin, HR | Creates prescriptive retention plan with incentive budget |
| `PUT` | `/interventions/{id}` | Admin, HR | Updates plan progress, transitioned risk score, or resolution |

---

## 9. Task & Workflow Management (`/api/v1/tasks`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/tasks/` | Authenticated | Lists retention checklists, onboarding, and compliance tasks |
| `POST` | `/tasks/` | Authenticated | Creates new HR workflow task with priority and deadline |
| `PUT` | `/tasks/{id}` | Authenticated | Updates status, assignee, or execution instructions |
| `DELETE` | `/tasks/{id}` | Authenticated | Deletes task item |
| `GET` | `/tasks/stats` | Authenticated | Returns counts for Pending, In Progress, and Completed tasks |

---

## 10. Performance Appraisals (`/api/v1/performance`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/performance/` | Authenticated | Lists performance reviews and ratings |
| `POST` | `/performance/` | Admin, HR | Submits appraisal, syncs employee evaluation score with AI |
| `GET` | `/performance/summary` | Authenticated | Returns organizational average rating and score distribution |

---

## 11. Report Generation & Export Center (`/api/v1/reports`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/reports/summary` | Authenticated | Report catalog metadata |
| `GET` | `/reports/employees/csv` | Admin, HR | Downloads full workforce master directory as CSV |
| `GET` | `/reports/attrition-risks/csv`| Admin, HR | Downloads prioritized flight risk report with AI factors |
| `GET` | `/reports/payroll/csv` | Admin, HR | Downloads payroll ledger report as CSV |
| `GET` | `/reports/audit/csv` | Admin | Downloads compliance audit ledger as CSV |

---

## 12. Audit Logging & Live Activity Feed (`/api/v1/audit`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/audit/` | Admin, HR | Filterable audit log (Action, Entity, Timestamp, IP) |
| `GET` | `/audit/activity-feed` | Authenticated | Real-time chronological activity and risk event stream |
