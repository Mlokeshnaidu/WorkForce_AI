import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('workforce_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('workforce_token');
      localStorage.removeItem('workforce_user');
      window.dispatchEvent(new Event('auth-expired'));
    }
    return Promise.reject(error);
  }
);

// Module 1 & 26: Authentication & RBAC
export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (email, new_password) => {
    const res = await api.post('/auth/reset-password', { email, new_password });
    return res.data;
  },
};


// Module 3: Departments
export const departmentService = {
  getAll: async () => {
    const res = await api.get('/departments/');
    return res.data;
  },
  getStats: async () => {
    const res = await api.get('/departments/stats/summary');
    return res.data;
  },
  create: async (deptData) => {
    const res = await api.post('/departments/', deptData);
    return res.data;
  },
  update: async (id, deptData) => {
    const res = await api.put(`/departments/${id}`, deptData);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/departments/${id}`);
    return res.data;
  },
};

// Module 2: Employees
export const employeeService = {
  getAll: async (params = {}) => {
    const res = await api.get('/employees/', { params });
    return res.data;
  },
  getOverviewStats: async () => {
    const res = await api.get('/employees/stats/overview');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },
  create: async (empData) => {
    const res = await api.post('/employees/', empData);
    return res.data;
  },
  update: async (id, empData) => {
    const res = await api.put(`/employees/${id}`, empData);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/employees/${id}`);
    return res.data;
  },
};

// Module 4: Attendance & Shifts
export const attendanceService = {
  checkIn: async (data) => {
    const res = await api.post('/attendance/check-in', data);
    return res.data;
  },
  checkOut: async (data) => {
    const res = await api.post('/attendance/check-out', data);
    return res.data;
  },
  getTodayStatus: async (employeeId) => {
    const res = await api.get(`/attendance/today/${employeeId}`);
    return res.data;
  },
  getHistory: async (params = {}) => {
    const res = await api.get('/attendance/history', { params });
    return res.data;
  },
  getSummary: async () => {
    const res = await api.get('/attendance/stats/summary');
    return res.data;
  },
};

// Module 5: Leave Management
export const leaveService = {
  apply: async (leaveData) => {
    const res = await api.post('/leaves/', leaveData);
    return res.data;
  },
  getAll: async (params = {}) => {
    const res = await api.get('/leaves/', { params });
    return res.data;
  },
  review: async (id, reviewData) => {
    const res = await api.put(`/leaves/${id}/review`, reviewData);
    return res.data;
  },
  getBalances: async (employeeId) => {
    const res = await api.get(`/leaves/balances/${employeeId}`);
    return res.data;
  },
};

// Module 6: Payroll Management
export const payrollService = {
  generate: async (monthOrData, maybeYear) => {
    let payload;
    if (typeof monthOrData === 'object' && monthOrData !== null) {
      payload = monthOrData;
    } else {
      payload = { month: monthOrData, year: maybeYear };
    }
    const res = await api.post('/payrolls/generate', payload);
    return res.data;
  },
  getAll: async (params = {}) => {
    const res = await api.get('/payrolls/', { params });
    return res.data;
  },
  updateStatus: async (id, statusData) => {
    const res = await api.put(`/payrolls/${id}/status`, statusData);
    return res.data;
  },
  markAsPaid: async (payrollId) => {
    const res = await api.put(`/payrolls/${payrollId}/status`, { status: 'PAID' });
    return res.data;
  },
  getSummary: async (monthOrParams = {}, maybeYear) => {
    let params;
    if (typeof monthOrParams === 'object' && monthOrParams !== null) {
      params = monthOrParams;
    } else if (monthOrParams !== undefined) {
      params = { month: monthOrParams, year: maybeYear };
    } else {
      params = {};
    }
    const res = await api.get('/payrolls/stats/summary', { params });
    return res.data;
  },
  getPayslip: async (payrollId) => {
    const res = await api.get(`/payrolls/${payrollId}/payslip`);
    return res.data;
  },
  downloadPayslipPdfUrl: (payrollId) => `${API_BASE_URL}/payrolls/${payrollId}/payslip/pdf`,
};

// Module 7: Notifications & Alerts
export const notificationService = {
  getAll: async () => {
    const res = await api.get('/notifications/');
    return res.data;
  },
  markRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.put('/notifications/mark-all-read');
    return res.data;
  },
};

// Module 8: Chat & Communication
export const chatService = {
  sendMessage: async (receiverId, message) => {
    const res = await api.post('/chats/', { receiver_id: receiverId, message });
    return res.data;
  },
  getConversation: async (otherUserId) => {
    const res = await api.get(`/chats/conversation/${otherUserId}`);
    return res.data;
  },
  getContacts: async () => {
    const res = await api.get('/chats/contacts');
    return res.data;
  },
};

// Module 9: Document Management
export const documentService = {
  upload: async (docData) => {
    const res = await api.post('/documents/', docData);
    return res.data;
  },
  create: async (docData) => {
    const res = await api.post('/documents/', docData);
    return res.data;
  },
  getByEmployee: async (employeeId) => {
    const res = await api.get(`/documents/employee/${employeeId}`);
    return res.data;
  },
  getAll: async (params = {}) => {
    const res = await api.get('/documents/', { params });
    return res.data;
  },
  deleteDoc: async (id) => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },
  downloadUrl: (id) => `${API_BASE_URL}/documents/${id}/download`,
};

// Modules 11-17, 23, 25: AI Attrition & Intelligence
export const aiService = {
  getOverview: async () => {
    const res = await api.get('/ai/overview');
    return res.data;
  },
  predict: async (data) => {
    const res = await api.post('/ai/predict', data);
    return res.data;
  },
  predictEmployee: async (employeeId) => {
    const res = await api.post(`/ai/predict/${employeeId}`);
    return res.data;
  },
  recalculateAll: async () => {
    const res = await api.post('/ai/recalculate-all');
    return res.data;
  },
  getForecast: async () => {
    const res = await api.get('/ai/forecast');
    return res.data;
  },
  getModelMetrics: async () => {
    const res = await api.get('/ai/model-metrics');
    return res.data;
  },
  getDatasets: async () => {
    const res = await api.get('/ai/datasets');
    return res.data;
  },
  uploadDataset: async (formData) => {
    const res = await api.post('/ai/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getLogs: async (limit = 50) => {
    const res = await api.get(`/ai/logs?limit=${limit}`);
    return res.data;
  },
};

// Modules 18 & 21: Prescriptive Retention Interventions
export const interventionService = {
  getAll: async (params = {}) => {
    const res = await api.get('/interventions/', { params });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/interventions/', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/interventions/${id}`, data);
    return res.data;
  },
};

// Module 20: Task & Workflow Management
export const taskService = {
  getAll: async (params = {}) => {
    const res = await api.get('/tasks/', { params });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/tasks/', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/tasks/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  },
  getStats: async () => {
    const res = await api.get('/tasks/stats');
    return res.data;
  },
};

// Module 22: Performance Review & Appraisal
export const performanceService = {
  getAll: async (params = {}) => {
    const res = await api.get('/performance/', { params });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/performance/', data);
    return res.data;
  },
  getSummary: async () => {
    const res = await api.get('/performance/summary');
    return res.data;
  },
};

// Module 19: Report Generation & Export Center
export const reportService = {
  getSummary: async () => {
    const res = await api.get('/reports/summary');
    return res.data;
  },
  exportEmployeesCsvUrl: () => `${API_BASE_URL}/reports/employees/csv`,
  exportEmployeesExcelUrl: () => `${API_BASE_URL}/reports/employees/excel`,
  exportEmployeesPdfUrl: () => `${API_BASE_URL}/reports/employees/pdf`,
  exportAttritionRisksCsvUrl: () => `${API_BASE_URL}/reports/attrition-risks/csv`,
  exportAttritionRisksExcelUrl: () => `${API_BASE_URL}/reports/attrition-risks/excel`,
  exportAttritionRisksPdfUrl: () => `${API_BASE_URL}/reports/attrition-risks/pdf`,
  exportPayrollCsvUrl: () => `${API_BASE_URL}/reports/payroll/csv`,
  exportPayrollExcelUrl: () => `${API_BASE_URL}/reports/payroll/excel`,
  exportAttendanceCsvUrl: () => `${API_BASE_URL}/reports/attendance/csv`,
  exportAttendanceExcelUrl: () => `${API_BASE_URL}/reports/attendance/excel`,
  exportAuditCsvUrl: () => `${API_BASE_URL}/reports/audit/csv`,
};

// Module 27 & 30: Audit Logging & Live Activity Feed
export const auditService = {
  getAll: async (params = {}) => {
    const res = await api.get('/audit/', { params });
    return res.data;
  },
  getActivityFeed: async (limit = 30) => {
    const res = await api.get(`/audit/activity-feed?limit=${limit}`);
    return res.data;
  },
};

export default api;

