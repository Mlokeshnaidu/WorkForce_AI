import React, { useState, useEffect } from 'react';
import { aiService, employeeService } from '../services/api';

export default function AIIntelligence() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [predictionData, setPredictionData] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll({ limit: 100 });
      const empList = data.items || data || [];
      setEmployees(empList);
      if (empList.length > 0) {
        setSelectedEmpId(empList[0].id);
        runPredictionForEmployee(empList[0].id);
      }
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  const runPredictionForEmployee = async (id) => {
    setLoading(true);
    try {
      const res = await aiService.predictEmployee(id);
      setPredictionData(res);
    } catch (err) {
      console.error('Prediction failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    try {
      await aiService.recalculateAll();
      await loadEmployees();
      if (selectedEmpId) {
        await runPredictionForEmployee(selectedEmpId);
      }
    } catch (err) {
      console.error('Recalculation error', err);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            AI Attrition Prediction & Risk Diagnostics
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Real-time Scikit-Learn Random Forest attrition prediction, confidence scoring, and prescriptive retention actions.
          </p>
        </div>

        <button
          onClick={handleRecalculateAll}
          disabled={recalculating}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#1a56db] hover:bg-blue-700 text-white font-medium text-xs transition disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <span>{recalculating ? 'Recalculating...' : 'Recalculate Fleet Risks'}</span>
        </button>
      </div>

      {/* Main Prediction & Factor Diagnostics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Employee Selection & Risk Metrics */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Select Workforce Member
          </h2>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Active Employees
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => {
                setSelectedEmpId(e.target.value);
                runPredictionForEmployee(e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-xs focus:outline-none focus:border-blue-500 transition cursor-pointer"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} — {emp.job_title} ({emp.risk_level || 'LOW'})
                </option>
              ))}
            </select>
          </div>

          {predictionData && (
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block mb-1">Calculated Flight Risk</span>
                <div className="flex items-baseline space-x-2">
                  <span
                    className={`text-3xl font-extrabold ${
                      predictionData.prediction.risk_level === 'HIGH'
                        ? 'text-rose-600'
                        : predictionData.prediction.risk_level === 'MEDIUM'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {predictionData.prediction.risk_percentage}%
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      predictionData.prediction.risk_level === 'HIGH'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : predictionData.prediction.risk_level === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {predictionData.prediction.risk_level} RISK
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      predictionData.prediction.risk_level === 'HIGH'
                        ? 'bg-rose-500'
                        : predictionData.prediction.risk_level === 'MEDIUM'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, predictionData.prediction.risk_percentage)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Inference Confidence</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">
                    {Math.round(predictionData.prediction.confidence * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Algorithm</span>
                  <span className="text-xs font-semibold text-blue-600 mt-1 block">
                    RandomForest (120)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Behavioral Factors & AI Recommendations */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              Key Behavioral Factors & AI Recommendations
            </h2>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <p className="text-xs">Analyzing employee telemetry...</p>
            </div>
          ) : predictionData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Behavioral Signals */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Key Behavioral Signals Detected
                </h3>
                <div className="space-y-2">
                  {predictionData.prediction.top_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-start space-x-2.5"
                    >
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prescriptive Actions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  AI Prescriptive Retention Actions
                </h3>
                <div className="space-y-2">
                  {predictionData.prediction.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start space-x-2.5"
                    >
                      <span className="font-bold text-emerald-600 shrink-0 mt-0.5">→</span>
                      <span className="leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
