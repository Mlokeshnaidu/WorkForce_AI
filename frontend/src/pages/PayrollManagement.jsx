import React, { useState, useEffect } from 'react';
import { payrollService } from '../services/api';

export default function PayrollManagement({ currentUser }) {
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadPayrollData();
  }, [month, year]);

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      const [list, sum] = await Promise.all([
        payrollService.getAll({ month, year }),
        payrollService.getSummary(month, year)
      ]);
      setPayrolls(list || []);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await payrollService.generate({ month, year });
      await loadPayrollData();
      alert(`Payroll cycle for ${month}/${year} generated successfully!`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate payroll.');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsPaid = async (payrollId) => {
    try {
      await payrollService.markAsPaid(payrollId);
      loadPayrollData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update payroll status.');
    }
  };

  const handleViewPayslip = async (payrollId) => {
    try {
      const data = await payrollService.getPayslip(payrollId);
      setSelectedPayslip(data);
    } catch (err) {
      alert('Failed to load payslip statement.');
    }
  };

  const handleDownloadPayslip = (payrollId, employeeName) => {
    const token = localStorage.getItem('workforce_token');
    const url = `http://localhost:8000/api/v1/payrolls/${payrollId}/payslip/pdf`;
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to download PDF');
        return res.blob();
      })
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `payslip_${year}_${month}_${employeeName ? employeeName.replace(/\s+/g, '_') : payrollId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => {
        console.error('PDF error', err);
        alert('Could not download payslip PDF.');
      });
  };

  const canManage = currentUser && ['ADMIN', 'HR'].includes(currentUser?.role?.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payroll & Compensation Management</h2>
          <p className="text-xs text-slate-500 mt-1">Automated compensation calculation, tax deductions, bonuses, and official PDF payslip generation</p>
        </div>

        {canManage && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition self-start sm:self-auto disabled:opacity-50 shadow-xs"
          >
            <span>{generating ? 'Processing Payroll...' : `Generate ${month}/${year} Payroll`}</span>
          </button>
        )}
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Disbursed Net</span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600">₹{summary?.total_paid_net?.toLocaleString('en-IN') || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">{summary?.paid_count || 0} payslips paid</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Payouts</span>
          </div>
          <p className="text-3xl font-extrabold text-amber-600">₹{summary?.total_pending_net?.toLocaleString('en-IN') || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">{summary?.pending_count || 0} pending processing</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Tax Withheld (12%)</span>
          </div>
          <p className="text-3xl font-extrabold text-purple-600">₹{summary?.total_tax_withheld?.toLocaleString('en-IN') || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Automatic compliance deduction</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Headcount Run</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{summary?.total_records || 0} Staff</p>
          <p className="text-[11px] text-slate-400 mt-1">For cycle {month}/{year}</p>
        </div>
      </div>

      {/* Payslip Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Monthly Compensation Breakdown & Payslips ({month}/{year})
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Cycle:</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="py-1 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  Month {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Base Salary (₹)</th>
                <th className="py-3 px-4">Allowances (+15%) (₹)</th>
                <th className="py-3 px-4">Bonus (₹)</th>
                <th className="py-3 px-4">Tax Deductions (-12%) (₹)</th>
                <th className="py-3 px-4">Net Salary (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Payslip Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No payroll generated yet for this period. Click "Generate Payroll" above!
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{p.employee_name}</p>
                      <p className="text-[11px] text-slate-400">{p.job_title}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{p.department_name}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      ₹{p.base_salary.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-medium">
                      +₹{p.allowances.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-purple-600 font-medium">
                      {p.bonuses > 0 ? `+₹${p.bonuses.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-rose-600 font-medium">
                      -₹{p.tax_deductions.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      ₹{p.net_salary.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                          p.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewPayslip(p.id)}
                        title="View Breakdown"
                        className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer border border-slate-200 inline-block"
                      >
                        View
                      </button>

                      <button
                        onClick={() => handleDownloadPayslip(p.id, p.employee_name)}
                        title="Download Payslip PDF"
                        className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1 shadow-xs"
                      >
                        Payslip PDF
                      </button>

                      {canManage && p.status !== 'PAID' && (
                        <button
                          onClick={() => handleMarkAsPaid(p.id)}
                          className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-colors shadow-xs"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip View Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Payslip Statement</h3>
                <p className="text-xs text-slate-400">{selectedPayslip.payslip_id} • Cycle {selectedPayslip.period}</p>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-700 rounded-lg bg-slate-100 cursor-pointer font-semibold text-xs"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee</span>
                <span className="font-semibold text-slate-900">{selectedPayslip.employee_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                <span className="font-semibold text-slate-900">{selectedPayslip.department_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Designation</span>
                <span className="text-slate-700">{selectedPayslip.job_title}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Status</span>
                <span className="text-emerald-700 font-bold">{selectedPayslip.status}</span>
              </div>
            </div>

            {/* Earnings & Deductions breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Earnings & Deductions</h4>
              <div className="divide-y divide-slate-100 text-xs border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex justify-between p-2.5 bg-white">
                  <span className="text-slate-600">Basic Monthly Salary</span>
                  <span className="font-mono text-slate-900 font-medium">₹{selectedPayslip.earnings.base_salary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white">
                  <span className="text-slate-600">Standard Allowances (+15%)</span>
                  <span className="font-mono text-emerald-600 font-medium">+₹{selectedPayslip.earnings.allowances.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white">
                  <span className="text-slate-600">Performance Incentive</span>
                  <span className="font-mono text-purple-600 font-medium">
                    {selectedPayslip.earnings.bonuses > 0 ? `+₹${selectedPayslip.earnings.bonuses.toLocaleString('en-IN')}` : '₹0.00'}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 bg-white">
                  <span className="text-slate-600">Tax Withholding (12%)</span>
                  <span className="font-mono text-rose-600 font-medium">-₹{selectedPayslip.deductions.tax_deductions.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between p-3 bg-emerald-50 font-bold text-sm">
                  <span className="text-emerald-900">Net Take-Home Pay</span>
                  <span className="font-mono text-emerald-700">₹{selectedPayslip.net_salary.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadPayslip(selectedPayslip.payroll_id, selectedPayslip.employee_name)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                Download Official PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
