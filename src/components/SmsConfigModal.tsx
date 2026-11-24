import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SmsConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [fast2smsKey, setFast2smsKey] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioAuth, setTwilioAuth] = useState('');
  const [twilioPhone, setTwilioPhone] = useState('');
  const [activeTab, setActiveTab] = useState<'fast2sms' | 'twilio'>('fast2sms');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load existing settings if saved in localStorage
    const savedFastKey = localStorage.getItem('safeway_fast2sms_key');
    if (savedFastKey) setFast2smsKey(savedFastKey);
    const savedTwilioSid = localStorage.getItem('safeway_twilio_sid');
    if (savedTwilioSid) setTwilioSid(savedTwilioSid);
    const savedTwilioPhone = localStorage.getItem('safeway_twilio_phone');
    if (savedTwilioPhone) setTwilioPhone(savedTwilioPhone);
  }, []);

  if (!isOpen) return null;

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const response = await fetch('/api/config/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fast2smsApiKey: fast2smsKey,
          twilioAccountSid: twilioSid,
          twilioAuthToken: twilioAuth,
          twilioPhoneNumber: twilioPhone,
        }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Server did not return JSON. Please ensure the dev server is running.');
      }

      if (response.ok && data.success) {
        setSaveStatus('✅ SMS Gateway credentials saved successfully!');
        localStorage.setItem('safeway_fast2sms_key', fast2smsKey);
        localStorage.setItem('safeway_twilio_sid', twilioSid);
        localStorage.setItem('safeway_twilio_phone', twilioPhone);
        setTimeout(() => {
          onClose();
          setSaveStatus(null);
        }, 1200);
      } else {
        setSaveStatus(`❌ Error: ${data.message || 'Failed to save configuration'}`);
      }
    } catch (err: any) {
      setSaveStatus(`❌ Network error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">Direct SMS Gateway Setup</h3>
            <p className="text-xs text-slate-400">Connect a real SMS service to deliver cellular SMS automatically</p>
          </div>
        </div>

        {/* Informative Note */}
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-3.5 mb-5 text-xs text-amber-200/90 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Why wasn't SMS delivered automatically?
          </p>
          <p>
            Desktop browsers don't have SIM cards. To make your contacts' phones ring with a direct SMS from your PC without opening an app, you need a free SMS API key (Fast2SMS for India or Twilio globally).
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('fast2sms')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'fast2sms'
                ? 'bg-sky-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🇮🇳 Fast2SMS (Recommended for India)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('twilio')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'twilio'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🌍 Twilio (Global)
          </button>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          {activeTab === 'fast2sms' ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">Fast2SMS Authorization API Key</label>
                  <a
                    href="https://www.fast2sms.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
                  >
                    Get Free Key at fast2sms.com <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="text"
                  placeholder="Paste your Fast2SMS API Key here"
                  value={fast2smsKey}
                  onChange={(e) => setFast2smsKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  1. Go to fast2sms.com ➔ Sign up with your mobile ➔ Click "Dev API" ➔ Copy your API key.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Twilio Account SID</label>
                <input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Twilio Auth Token</label>
                <input
                  type="password"
                  placeholder="Your Twilio Auth Token"
                  value={twilioAuth}
                  onChange={(e) => setTwilioAuth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Twilio Phone Number</label>
                <input
                  type="text"
                  placeholder="+1234567890"
                  value={twilioPhone}
                  onChange={(e) => setTwilioPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {saveStatus && (
            <div className="text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-center font-medium">
              {saveStatus}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-sky-600/30 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSaving ? 'Connecting...' : 'Save & Enable Direct SMS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
