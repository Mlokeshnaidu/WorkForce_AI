import os
import sys

# Ensure backend root is in sys.path and .env is loaded regardless of working directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
os.chdir(BACKEND_DIR)

import unittest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestWorkforceAIProAllModules(unittest.TestCase):
    """
    Comprehensive Automated Test Suite verifying all 30 Modules across 3 Phases.
    """

    @classmethod
    def setUpClass(cls):
        # 1. Obtain JWT token using seeded admin credentials
        login_res = client.post("/api/v1/auth/login", json={
            "email": "admin@workforce.ai",
            "password": "Admin@123"
        })
        assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
        data = login_res.json()
        cls.token = data["access_token"]
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

    # --- System Status & Health ---
    def test_01_root_and_health(self):
        res = client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["platform"], "WorkForce AI Pro")
        self.assertEqual(len(res.json()["active_modules"]), 30)

        res_h = client.get("/health")
        self.assertEqual(res_h.status_code, 200)
        self.assertEqual(res_h.json()["status"], "healthy")

    # --- Module 1: Auth & Forgot/Reset Password ---
    def test_02_auth_me_and_forgot_password(self):
        me_res = client.get("/api/v1/auth/me", headers=self.headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], "admin@workforce.ai")

        forgot_res = client.post("/api/v1/auth/forgot-password", json={
            "email": "admin@workforce.ai"
        })
        self.assertEqual(forgot_res.status_code, 200)
        self.assertIn("reset_token", forgot_res.json())

    # --- Module 3: Departments ---
    def test_03_departments(self):
        res = client.get("/api/v1/departments/", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        depts = res.json()
        self.assertGreater(len(depts), 0)

    # --- Module 2 & 10: Employees & Profiles ---
    def test_04_employees_directory(self):
        res = client.get("/api/v1/employees/", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        items = data if isinstance(data, list) else data.get("items", [])
        self.assertGreater(len(items), 0)

    # --- Module 4: Attendance & Shifts ---
    def test_05_attendance_history(self):
        res = client.get("/api/v1/attendance/history", headers=self.headers)
        self.assertEqual(res.status_code, 200)

    # --- Module 5: Leave Management ---
    def test_06_leaves(self):
        res = client.get("/api/v1/leaves/", headers=self.headers)
        self.assertEqual(res.status_code, 200)

    # --- Module 6: Payroll ---
    def test_07_payroll(self):
        res = client.get("/api/v1/payrolls/", headers=self.headers)
        self.assertEqual(res.status_code, 200)

    # --- Module 7: Notifications ---
    def test_08_notifications(self):
        res = client.get("/api/v1/notifications/", headers=self.headers)
        self.assertEqual(res.status_code, 200)

    # --- Module 8: Chat Communications ---
    def test_09_chat_contacts(self):
        res = client.get("/api/v1/chats/contacts", headers=self.headers)
        self.assertEqual(res.status_code, 200)

    # --- Module 9: Documents ---
    def test_10_documents(self):
        res = client.get("/api/v1/documents/", headers=self.headers)
        self.assertEqual(res.status_code, 200)

    # --- Module 11 & 12: Dataset & ML Model Management ---
    def test_11_ai_datasets_and_model_metrics(self):
        res = client.get("/api/v1/ai/datasets", headers=self.headers)
        self.assertEqual(res.status_code, 200)

        metrics_res = client.get("/api/v1/ai/model-metrics", headers=self.headers)
        self.assertEqual(metrics_res.status_code, 200)
        data = metrics_res.json()
        self.assertIn("algorithm", data)
        self.assertIn("feature_importances", data)

    # --- Module 13 & 14: AI Attrition Scoring & Explainability ---
    def test_12_ai_prediction_inference(self):
        # Predict on custom features
        pred_res = client.post("/api/v1/ai/predict", headers=self.headers, json={
            "satisfaction_level": 0.25,
            "last_evaluation": 0.88,
            "number_of_projects": 6,
            "average_monthly_hours": 260,
            "time_spent_company": 4,
            "salary_level": 0
        })
        self.assertEqual(pred_res.status_code, 200)
        pred = pred_res.json()
        self.assertIn("risk_score", pred)
        self.assertEqual(pred["risk_level"], "HIGH")
        self.assertGreater(len(pred["top_factors"]), 0)
        self.assertGreater(len(pred["recommendations"]), 0)

    # --- Module 12 & 13: Employee Risk Recalculation ---
    def test_13_employee_prediction_and_recalculate(self):
        pred_emp = client.post("/api/v1/ai/predict/1", headers=self.headers)
        self.assertEqual(pred_emp.status_code, 200)
        self.assertIn("prediction", pred_emp.json())

        recalc_res = client.post("/api/v1/ai/recalculate-all", headers=self.headers)
        self.assertEqual(recalc_res.status_code, 200)
        self.assertEqual(recalc_res.json()["status"], "success")

    # --- Module 14 & 27: Forecasting & Stability Index ---
    def test_14_ai_overview_and_forecast(self):
        ov_res = client.get("/api/v1/ai/overview", headers=self.headers)
        self.assertEqual(ov_res.status_code, 200)
        ov = ov_res.json()
        self.assertIn("workforce_stability_index", ov)
        self.assertIn("departments_risk", ov)

        fc_res = client.get("/api/v1/ai/forecast", headers=self.headers)
        self.assertEqual(fc_res.status_code, 200)
        fc = fc_res.json()
        self.assertEqual(len(fc["forecast_timeline"]), 6)

    # --- Module 13: Historical Risk Assessment Logs ---
    def test_15_ai_risk_logs(self):
        res = client.get("/api/v1/ai/logs", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    # --- Module 16: Prescriptive Retention Interventions ---
    def test_16_interventions(self):
        res = client.get("/api/v1/interventions/", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    # --- Module 20: Tasks & Workflows ---
    def test_17_tasks_and_stats(self):
        res = client.get("/api/v1/tasks/", headers=self.headers)
        self.assertEqual(res.status_code, 200)

        stats_res = client.get("/api/v1/tasks/stats", headers=self.headers)
        self.assertEqual(stats_res.status_code, 200)
        self.assertIn("total_tasks", stats_res.json())

    # --- Module 22: Performance Appraisals ---
    def test_18_performance_reviews(self):
        res = client.get("/api/v1/performance/", headers=self.headers)
        self.assertEqual(res.status_code, 200)

        sum_res = client.get("/api/v1/performance/summary", headers=self.headers)
        self.assertEqual(sum_res.status_code, 200)
        self.assertIn("average_rating", sum_res.json())

    # --- Module 24: CSV Export Center ---
    def test_19_reports_export(self):
        summary = client.get("/api/v1/reports/summary", headers=self.headers)
        self.assertEqual(summary.status_code, 200)

        csv_res = client.get("/api/v1/reports/employees/csv", headers=self.headers)
        self.assertEqual(csv_res.status_code, 200)
        self.assertEqual(csv_res.headers["content-type"], "text/csv; charset=utf-8")
        self.assertIn("Employee ID,First Name,Last Name", csv_res.text)

    # --- Module 27 & 30: Audit Trail & Live Activity Feed ---
    def test_20_audit_and_activity_feed(self):
        res_audit = client.get("/api/v1/audit/", headers=self.headers)
        self.assertEqual(res_audit.status_code, 200)
        self.assertGreater(len(res_audit.json()), 0)

        res_feed = client.get("/api/v1/audit/activity-feed", headers=self.headers)
        self.assertEqual(res_feed.status_code, 200)
        self.assertGreater(len(res_feed.json()), 0)


if __name__ == "__main__":
    unittest.main()
