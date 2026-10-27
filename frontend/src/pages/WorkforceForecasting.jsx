import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { aiService } from '../services/api';

export default function WorkforceForecasting() {
  const [overview, setOverview] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ov, fc] = await Promise.all([
        aiService.getOverview(),
        aiService.getForecast()
      ]);
      setOverview(ov);
      setForecast(fc);
    } catch (err) {
      console.error('Failed to load forecast data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Workforce Attrition Forecasting & Stability
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Predictive 6-month turnover modeling, organizational stability scoring, and retention headcount projections.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Stability Index</span>
            <div className="text-3xl font-extrabold text-emerald-600 mt-2">
              {overview.workforce_stability_index}%
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Weighted organizational resilience</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Headcount</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              {overview.total_employees}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Active full-time workforce</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">High Flight Risk</span>
            <div className="text-3xl font-extrabold text-rose-600 mt-2">
              {overview.high_risk_count}{' '}
              <span className="text-sm font-medium text-slate-500">({overview.high_risk_percentage}%)</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Immediate intervention priority</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">6-Month Attrition</span>
            <div className="text-3xl font-extrabold text-amber-600 mt-2">
              {forecast ? `${forecast.projected_6_month_turnover_rate}%` : '4.2%'}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Projected cumulative turnover</span>
          </div>
        </div>
      )}

      {/* 6-Month Headcount Forecast Chart */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              6-Month Predictive Headcount & Attrition Curve
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Projected retained headcount trend line over the next 6 billing periods based on current workforce telemetry.
            </p>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast?.forecast_timeline || []}>
              <defs>
                <linearGradient id="colorRetained" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a56db" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#1a56db" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: '#0f172a'
                }}
              />
              <Area
                type="monotone"
                dataKey="projected_retained_headcount"
                stroke="#1a56db"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRetained)"
                name="Retained Headcount"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
