import React, { useState } from 'react';
import { X, Smartphone, Mail, Shield, CheckCircle2, AlertCircle, ArrowRight, User, Heart, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: UserProfile) => void;
  currentProfile?: UserProfile | null;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess, currentProfile }) => {
  const [activeTab, setActiveTab] = useState<'phone' | 'google'>('phone');
  
  // Phone + OTP State
  const [name, setName] = useState(currentProfile?.name || '');
  const [phone, setPhone] = useState(currentProfile?.phone?.replace('+91', '') || '');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  // Google / Email State
  const [googleName, setGoogleName] = useState(currentProfile?.name || '');
  const [googleEmail, setGoogleEmail] = useState(currentProfile?.email || '');

  // Emergency Medical State
  const [bloodGroup, setBloodGroup] = useState(currentProfile?.bloodGroup || 'O+');
  const [emergencyNotes, setEmergencyNotes] = useState(currentProfile?.emergencyNotes || '');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter your full name so contacts can identify you.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, name: name.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsOtpSent(true);
        setSuccessMessage(`OTP sent to +91${cleanPhone}`);
        if (data.demoOtp) {
          setDemoOtp(data.demoOtp);
          setOtp(data.demoOtp); // Auto-fill for ultra-smooth testing
        }
      } else {
        setErrorMessage(data.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while sending OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!otp.trim()) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    setIsVerifying(true);
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          otp: otp.trim(),
          name: name.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const profile: UserProfile = {
          ...data.user,
          name: name.trim(),
          bloodGroup,
          emergencyNotes: emergencyNotes.trim(),
          authMethod: 'phone',
        };

        setSuccessMessage('Verified successfully! Logging in...');
        setTimeout(() => {
          onLoginSuccess(profile);
          onClose();
        }, 800);
      } else {
        setErrorMessage(data.error || 'Invalid OTP code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification error.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Google / Gmail Sign In
  const handleGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!googleEmail.trim() || !googleEmail.includes('@')) {
      setErrorMessage('Please enter a valid Gmail / Email address.');
      return;
    }

    const profile: UserProfile = {
      id: `usr_${Date.now()}`,
      name: googleName.trim(),
      email: googleEmail.trim(),
      bloodGroup,
      emergencyNotes: emergencyNotes.trim(),
      authMethod: 'google',
      createdAt: Date.now(),
    };

    setSuccessMessage('Signed in with Google successfully!');
    setTimeout(() => {
      onLoginSuccess(profile);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-gradient-to-tr from-rose-600 to-red-500 text-white rounded-2xl shadow-lg shadow-rose-600/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">Emergency Profile & Sign In</h3>
            <p className="text-xs text-slate-400">Identifies who you are when sending SOS alerts</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => { setActiveTab('phone'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'phone'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Mobile & OTP
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('google'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            Gmail / Google
          </button>
        </div>

        {/* Alert / Feedback Messages */}
        {errorMessage && (
          <div className="mb-4 text-xs bg-rose-950/60 border border-rose-800/60 text-rose-300 p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 text-xs bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 p-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: Mobile + OTP */}
        {activeTab === 'phone' && (
          <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isOtpSent}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 disabled:opacity-70"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number (India +91)</label>
              <div className="flex gap-2">
                <span className="px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-400 flex items-center">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isOtpSent}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 disabled:opacity-70"
                  required
                />
              </div>
            </div>

            {/* OTP Section (Shown once OTP is requested) */}
            {isOtpSent && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-emerald-400">Enter 6-digit OTP Code</label>
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={isSendingOtp}
                    className="text-[11px] text-sky-400 hover:text-sky-300 underline"
                  >
                    Resend OTP
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-3 py-2.5 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-emerald-400"
                  required
                  autoFocus
                />
                {demoOtp && (
                  <p className="text-[11px] text-slate-400 text-center">
                    💡 Test Code: <strong className="text-emerald-400 font-mono">{demoOtp}</strong> (Auto-filled)
                  </p>
                )}
              </div>
            )}

            {/* Optional Life-saving Medical Info */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Blood Group (Optional)</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="O+">O Positive (O+)</option>
                  <option value="A+">A Positive (A+)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="O-">O Negative (O-)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Medical Alert Note</label>
                <input
                  type="text"
                  placeholder="e.g. Asthma, Diabetic"
                  value={emergencyNotes}
                  onChange={(e) => setEmergencyNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              {isOtpSent ? (
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isVerifying ? 'Verifying OTP...' : 'Verify OTP & Log In'}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-4 h-4" />
                  {isSendingOtp ? 'Sending OTP SMS...' : 'Send OTP via SMS'}
                </button>
              )}
            </div>
          </form>
        )}

        {/* TAB 2: Google / Gmail */}
        {activeTab === 'google' && (
          <form onSubmit={handleGoogleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gmail / Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Optional Life-saving Medical Info */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="O+">O Positive (O+)</option>
                  <option value="A+">A Positive (A+)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="O-">O Negative (O-)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Medical Alert Note</label>
                <input
                  type="text"
                  placeholder="e.g. Asthma, Diabetic"
                  value={emergencyNotes}
                  onChange={(e) => setEmergencyNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="submit"
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google / Gmail</span>
            </button>
          </form>
        )}

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-slate-500 hover:text-slate-300"
          >
            Skip for now & Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};
