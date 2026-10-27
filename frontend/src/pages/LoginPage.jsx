import React, { useState } from 'react';
import { authService } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@workforce.ai');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot / Reset Password Modal State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [resetMsg, setResetMsg] = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please provide both work email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await authService.login(email, password);
      localStorage.setItem('workforce_token', data.access_token);
      localStorage.setItem('workforce_user', JSON.stringify(data));
      onLoginSuccess(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Invalid credentials. Please verify your work email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!forgotEmail || !newPassword) return;
    try {
      const res = await authService.resetPassword(forgotEmail, newPassword);
      setResetMsg(res.message || 'Password successfully updated!');
      setEmail(forgotEmail);
      setPassword(newPassword);
      setTimeout(() => {
        setShowForgot(false);
        setResetStep(1);
        setResetMsg('');
      }, 1500);
    } catch (err) {
      setResetMsg(err.response?.data?.detail || 'Failed to update password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6fc] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Brand Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#1a56db] flex items-center justify-center font-black text-white text-2xl mx-auto shadow-md shadow-blue-600/20 mb-3 border border-blue-400/30">
          W
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          WorkForce AI Pro
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          HR Attrition Prediction &amp; Workforce Intelligence
        </p>
      </div>

      {/* Main Sign In Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Card Header */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Sign In to Your Account
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your work credentials to access the platform
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 leading-relaxed">
            <span className="font-bold text-rose-600">Notice:</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Work Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
              placeholder="admin@workforce.ai"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1a56db] focus:ring-2 focus:ring-blue-500/15 transition font-medium"
            />
          </div>

          {/* Password with Show/Hide toggle */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setForgotEmail(email);
                  setResetStep(1);
                  setResetMsg('');
                }}
                className="text-[11px] text-[#1a56db] hover:text-blue-700 font-semibold transition cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                required
                placeholder="••••••••"
                className="w-full pl-4 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1a56db] focus:ring-2 focus:ring-blue-500/15 transition font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-slate-400 hover:text-slate-700 px-2 py-1 rounded transition cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Keep me signed in */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-[#1a56db] focus:ring-blue-500"
              />
              <span>Keep me signed in</span>
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 px-4 bg-[#1a56db] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold tracking-wide shadow-sm hover:shadow transition cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Card Trust Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>RBAC 4-Tier Access</span>
          </span>
          <span>256-bit SSL Encrypted</span>
        </div>
      </div>

      {/* Page Footer */}
      <div className="mt-6 text-center text-[11px] text-slate-400">
        WorkForce AI Pro • Enterprise Workforce Intelligence Platform
      </div>

      {/* Forgot & Reset Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-slate-800">
            <h4 className="text-sm font-bold text-slate-900">Reset Enterprise Password</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {resetStep === 1
                ? 'Verify your work email address to request password reset authorization.'
                : 'Enter your new secure password to reset your credentials.'}
            </p>

            {resetMsg && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl">
                {resetMsg}
              </div>
            )}

            {resetStep === 1 ? (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@workforce.ai"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-[#1a56db]"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={forgotEmail}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-[#1a56db]"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setResetMsg('');
                  setResetStep(1);
                }}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>

              {resetStep === 1 ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!forgotEmail) return;
                    try {
                      const res = await authService.forgotPassword(forgotEmail);
                      setResetMsg(res.message);
                      setResetStep(2);
                    } catch (err) {
                      setResetMsg('Unable to verify email address.');
                    }
                  }}
                  className="px-3.5 py-1.5 bg-[#1a56db] hover:bg-blue-700 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Verify Email
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetPasswordSubmit}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Update Password
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
