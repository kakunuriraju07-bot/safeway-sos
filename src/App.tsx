import React, { useState, useEffect } from 'react';
import { Shield, Settings, Bell, Info, LifeBuoy, Heart, Key } from 'lucide-react';
import { EmergencySOSButton } from './components/EmergencySOSButton';
import { TrustedContacts } from './components/TrustedContacts';
import { LiveLocationMap } from './components/LiveLocationMap';
import { EmergencyServices } from './components/EmergencyServices';
import { SafetyTipsAI } from './components/SafetyTipsAI';
import { SmsConfigModal } from './components/SmsConfigModal';
import { TrustedContact, LocationData } from './types';

const DEFAULT_CONTACTS: TrustedContact[] = [
  { id: '1', name: 'Primary Guardian (Family)', phone: '+919876543210', relationship: 'Family', isPrimary: true },
  { id: '2', name: 'Emergency Contact (Friend)', phone: '+919123456780', relationship: 'Friend' },
];

export const App: React.FC = () => {
  const [contacts, setContacts] = useState<TrustedContact[]>(() => {
    const saved = localStorage.getItem('safeway_trusted_contacts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_CONTACTS;
  });

  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isSmsConfigOpen, setIsSmsConfigOpen] = useState(false);
  const [hasSmsGateway, setHasSmsGateway] = useState(false);

  useEffect(() => {
    localStorage.setItem('safeway_trusted_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    // Check if SMS gateway is configured
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        if (data.hasFast2SMS || data.hasTwilio) {
          setHasSmsGateway(true);
        }
      })
      .catch(() => {});
  }, [isSmsConfigOpen]);

  const handleAddContact = (newContact: Omit<TrustedContact, 'id'>) => {
    const contact: TrustedContact = {
      ...newContact,
      id: Date.now().toString(),
    };
    setContacts((prev) => [...prev, contact]);
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white">SafeWay SOS</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                  Live Guard
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Instant Emergency Location & SMS Alert</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsSmsConfigOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            >
              <Key className="w-3.5 h-3.5 text-sky-400" />
              <span>{hasSmsGateway ? 'SMS Gateway: Active' : 'Setup Real SMS'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Banner Explaining SMS delivery */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-300">
              <strong className="text-white">Live Alerting System:</strong> Press the red SOS button to get your real-time GPS coordinates. Use the 1-click WhatsApp or Phone SMS button to alert your contacts immediately, or connect a free Fast2SMS/Twilio key in <button onClick={() => setIsSmsConfigOpen(true)} className="text-sky-400 underline font-semibold">SMS Settings</button> for automated background SMS!
            </p>
          </div>
        </div>

        {/* SOS Action Hub */}
        <EmergencySOSButton
          contacts={contacts}
          onOpenSmsConfig={() => setIsSmsConfigOpen(true)}
          onAlertTriggered={(loc) => setCurrentLocation(loc)}
        />

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrustedContacts
            contacts={contacts}
            onAddContact={handleAddContact}
            onDeleteContact={handleDeleteContact}
          />

          <LiveLocationMap location={currentLocation} />
        </div>

        <EmergencyServices />
        <SafetyTipsAI />
      </main>

      <SmsConfigModal
        isOpen={isSmsConfigOpen}
        onClose={() => setIsSmsConfigOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>SafeWay SOS Emergency Response System • Keep GPS turned on for maximum accuracy.</p>
          <p className="flex items-center gap-1 text-slate-400">
            Built for safety with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </footer>
    </div>
  );
};

