import React, { useState, useEffect } from 'react';
import { auditService } from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [feed, setFeed] = useState([]);
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' or 'feed'
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [entityFilter, actionFilter]);

  const loadData = async () => {
    try {
      const [auditData, feedData] = await Promise.all([
        auditService.getAll({
          entity: entityFilter || undefined,
          action: actionFilter || undefined
        }),
        auditService.getActivityFeed(30)
      ]);
      setLogs(auditData || []);
      setFeed(feedData || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Audit Trail & Live Activity Feed
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Immutable compliance event ledger and real-time operational activity stream.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Trail
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'feed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Live Feed
          </button>
        </div>
      </div>

      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              Compliance Event Ledger ({logs.length})
            </h2>

            <div className="flex items-center space-x-3">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">LOGIN</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="RETRAIN">RETRAIN</option>
                <option value="PREDICT_BATCH">PREDICT_BATCH</option>
              </select>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Entities</option>
                <option value="Employee">Employee</option>
                <option value="MLModelArtifact">MLModelArtifact</option>
                <option value="Intervention">Intervention</option>
                <option value="Auth">Auth</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Target Entity</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                  <th className="px-4 py-3 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      No audit events recorded for current filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition text-xs">
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {log.user_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium">{log.entity}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{log.details}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono">{log.ip_address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              Live Chronological Telemetry Stream
            </h2>
            <span className="text-xs text-slate-400">Real-time reactive audit + AI risk pulse</span>
          </div>

          <div className="space-y-3 pt-2">
            {feed.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex items-start space-x-3.5 transition ${
                  item.severity === 'CRITICAL'
                    ? 'bg-rose-50/60 border-rose-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{item.title}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{item.description}</p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">
                    Source: <strong className="text-slate-600 font-normal">{item.actor}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
