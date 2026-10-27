import React, { useState, useEffect } from 'react';
import { employeeService, departmentService } from '../services/api';

export default function EmployeeDirectory({ currentUser }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');

  // Add Employee Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    salary: 85000,
    department_id: '',
    satisfaction_level: 0.70,
    last_evaluation: 0.75,
    number_of_projects: 3,
    average_monthly_hours: 180,
    time_spent_company: 3,
    promotion_last_5years: 0
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [searchTerm, selectedDept, selectedRisk]);

  const loadDepartments = async () => {
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, department_id: data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.q = searchTerm;
      if (selectedDept) params.department_id = selectedDept;
      if (selectedRisk) params.risk_level = selectedRisk;

      const data = await employeeService.getAll(params);
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      await employeeService.create({
        ...formData,
        salary: parseFloat(formData.salary),
        department_id: parseInt(formData.department_id),
        satisfaction_level: parseFloat(formData.satisfaction_level),
        last_evaluation: parseFloat(formData.last_evaluation),
        number_of_projects: parseInt(formData.number_of_projects),
        average_monthly_hours: parseInt(formData.average_monthly_hours),
        time_spent_company: parseInt(formData.time_spent_company),
        promotion_last_5years: parseInt(formData.promotion_last_5years)
      });
      setIsModalOpen(false);
      loadEmployees();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create employee. Check fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await employeeService.delete(id);
      loadEmployees();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete employee profile.');
    }
  };

  const getRiskBadge = (riskLevel, riskScore) => {
    const pct = Math.round((riskScore || 0) * 100);
    switch (riskLevel) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
            High Risk ({pct}%)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
            Medium ({pct}%)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            Stable ({pct}%)
          </span>
        );
    }
  };

  const canModify = currentUser && ['ADMIN', 'HR'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage workforce records, profiles, and attrition risk profiles</p>
        </div>

        {canModify && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-4 bg-[#1a56db] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition self-start sm:self-auto shadow-xs"
          >
            + Add New Employee
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition"
          />
        </div>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>

        {/* Risk Level Filter */}
        <select
          value={selectedRisk}
          onChange={(e) => setSelectedRisk(e.target.value)}
          className="py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
        >
          <option value="">All Risk Levels</option>
          <option value="HIGH">High Risk Only</option>
          <option value="MEDIUM">Medium Risk Only</option>
          <option value="LOW">Low Risk / Stable Only</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Salary (₹)</th>
                <th className="py-3 px-4">Work Hours</th>
                <th className="py-3 px-4">Satisfaction</th>
                <th className="py-3 px-4">Attrition Risk</th>
                {canModify && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={canModify ? 7 : 6} className="py-12 text-center text-slate-400">
                    Loading records from MySQL...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={canModify ? 7 : 6} className="py-12 text-center text-slate-400">
                    No employees found matching the filters.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                          {emp.first_name[0]}
                          {emp.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-[11px] text-slate-400">{emp.job_title}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium">{emp.department_name}</span>
                    </td>

                    {/* Salary */}
                    <td className="py-3.5 px-4 text-slate-800 font-mono font-medium">
                      ₹{emp.salary.toLocaleString('en-IN')}
                    </td>

                    {/* Monthly Hours */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700">{emp.average_monthly_hours} hrs/mo</span>
                      <span className="text-[10px] text-slate-400 block">
                        {emp.number_of_projects} projects
                      </span>
                    </td>

                    {/* Satisfaction Bar */}
                    <td className="py-3.5 px-4">
                      <div className="w-24">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-400">Score</span>
                          <span className="font-bold text-slate-700">
                            {Math.round(emp.satisfaction_level * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              emp.satisfaction_level < 0.4
                                ? 'bg-rose-500'
                                : emp.satisfaction_level < 0.7
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${emp.satisfaction_level * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* AI Attrition Risk Badge */}
                    <td className="py-3.5 px-4">
                      {getRiskBadge(emp.risk_level, emp.current_risk_score)}
                    </td>

                    {/* Actions */}
                    {canModify && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() =>
                            handleDeleteEmployee(emp.id, `${emp.first_name} ${emp.last_name}`)
                          }
                          className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                Add New Employee
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-700 rounded-lg bg-slate-100 cursor-pointer font-semibold text-xs"
              >
                Close
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* AI Predictor Fields Sub-section */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-blue-600">
                  AI Predictor Attributes (Evaluates Attrition Risk)
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Satisfaction Score (0.0 - 1.0)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.0"
                      value={formData.satisfaction_level}
                      onChange={(e) => setFormData({ ...formData, satisfaction_level: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Avg Monthly Hours</label>
                    <input
                      type="number"
                      value={formData.average_monthly_hours}
                      onChange={(e) => setFormData({ ...formData, average_monthly_hours: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Active Projects Count</label>
                    <input
                      type="number"
                      value={formData.number_of_projects}
                      onChange={(e) => setFormData({ ...formData, number_of_projects: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Tenure (Years at Company)</label>
                    <input
                      type="number"
                      value={formData.time_spent_company}
                      onChange={(e) => setFormData({ ...formData, time_spent_company: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-5 bg-[#1a56db] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {saving ? 'Saving...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
