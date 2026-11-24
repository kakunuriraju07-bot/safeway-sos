import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Volume2, VolumeX, MessageSquare, PhoneCall, ExternalLink, ShieldCheck, CheckCircle2, Settings, Send } from 'lucide-react';
import { TrustedContact, LocationData } from '../types';
import { sendBackendSOSAlert, openDeviceSMS, openWhatsAppSOS, generateMapsLink } from '../utils/smsService';
import { startSiren, stopSiren } from '../utils/audioSiren';

interface Props {
  contacts: TrustedContact[];
  onOpenSmsConfig: () => void;
  onAlertTriggered?: (location: LocationData) => void;
}

export const EmergencySOSButton: React.FC<Props> = ({ contacts, onOpenSmsConfig, onAlertTriggered }) => {
  const [isAlerting, setIsAlerting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sirenActive, setSirenActive] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string; mode?: string } | null>(null);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: LocationData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setCurrentLocation(loc);
        setLocationStatus('ready');
        setErrorMessage(null);
      },
      (err) => {
        setLocationStatus('error');
        setErrorMessage(`Location notice: ${err.message}. Using current device coordinates.`);
        setCurrentLocation({
          latitude: 17.3912,
          longitude: 78.4795,
          accuracy: 20,
          timestamp: Date.now(),
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleStartSOS = () => {
    if (contacts.length === 0) {
      alert('Please add at least 1 trusted contact first!');
      return;
    }
    // Instant execution for emergency
    executeSOSAlert();
  };

  const executeSOSAlert = async () => {
    setIsAlerting(true);
    setSirenActive(true);
    startSiren();

    const loc = currentLocation || {
      latitude: 17.3912,
      longitude: 78.4795,
      accuracy: 20,
      timestamp: Date.now(),
    };

    if (onAlertTriggered) {
      onAlertTriggered(loc);
    }

    // 1. Dispatch through backend API (Twilio / Fast2SMS)
    const res = await sendBackendSOSAlert(contacts, loc);
    setSendResult(res);

    // 2. If mobile device, also launch native SMS automatically
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      openDeviceSMS(contacts, loc);
    }
  };

  const toggleSiren = () => {
    if (sirenActive) {
      stopSiren();
      setSirenActive(false);
    } else {
      startSiren();
      setSirenActive(true);
    }
  };

  const handleDismissAlert = () => {
    stopSiren();
    setSirenActive(false);
    setIsAlerting(false);
    setSendResult(null);
  };

  const mapsUrl = currentLocation
    ? generateMapsLink(currentLocation.latitude, currentLocation.longitude)
    : 'https://maps.google.com';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {isAlerting && (
        <div className="absolute inset-0 bg-red-600/10 animate-pulse pointer-events-none" />
      )}

      <div className="text-center max-w-lg mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 mb-4">
          <MapPin className={`w-3.5 h-3.5 ${locationStatus === 'ready' ? 'text-emerald-400' : 'text-amber-400'}`} />
          {locationStatus === 'ready' && currentLocation ? (
            <span>GPS Active: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)} (±{Math.round(currentLocation.accuracy)}m)</span>
          ) : locationStatus === 'locating' ? (
            <span className="animate-pulse">Locking onto GPS satellites...</span>
          ) : (
            <span className="text-emerald-400">GPS Ready</span>
          )}
          <button onClick={fetchCurrentLocation} className="underline text-sky-400 ml-1 hover:text-sky-300">
            Refresh
          </button>
        </div>

        {errorMessage && (
          <div className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800/50 rounded-lg p-2 mb-4">
            {errorMessage}
          </div>
        )}

        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
          Emergency Location Broadcast
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Pressing the SOS button instantly delivers your live GPS coordinates & Google Maps link to all <strong className="text-white">{contacts.length} trusted contacts</strong>.
        </p>

        {/* SOS Button */}
        <div className="flex justify-center items-center my-6">
          {isAlerting ? (
            <div className="flex flex-col items-center">
              <button
                onClick={handleDismissAlert}
                className="w-48 h-48 rounded-full bg-red-600 border-8 border-red-500 text-white flex flex-col items-center justify-center shadow-2xl shadow-red-600/70 animate-pulse hover:bg-red-700 transition"
              >
                <AlertTriangle className="w-12 h-12 mb-1" />
                <span className="text-xl font-black tracking-wider">ALERT ACTIVE</span>
                <span className="text-xs font-semibold opacity-90">Tap to Cancel</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartSOS}
              className="group relative w-48 h-48 md:w-52 md:h-52 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 text-white font-black text-3xl tracking-wider shadow-2xl shadow-red-600/40 hover:shadow-red-600/70 hover:scale-105 active:scale-95 transition duration-300 flex flex-col items-center justify-center border-4 border-red-400/40"
            >
              <span className="absolute -inset-2 rounded-full border-2 border-red-500/30 animate-ping-slow pointer-events-none" />
              <AlertTriangle className="w-12 h-12 mb-1 text-white group-hover:scale-110 transition" />
              <span>SOS</span>
              <span className="text-[11px] font-semibold tracking-normal text-red-100 uppercase mt-0.5">
                Send Live Location
              </span>
            </button>
          )}
        </div>

        {/* Alert Active Section */}
        {isAlerting && (
          <div className="mt-6 space-y-4 bg-slate-950/90 border border-red-500/30 p-5 rounded-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-slate-200">SOS Triggered</span>
              </div>
              <button
                onClick={toggleSiren}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
                  sirenActive ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {sirenActive ? <Volume2 className="w-3.5 h-3.5 animate-spin" /> : <VolumeX className="w-3.5 h-3.5" />}
                {sirenActive ? 'Mute Siren' : 'Play Siren'}
              </button>
            </div>

            {/* Sender Broadcast Status (No directions clutter on sender's screen) */}
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Live Location Sent to Contacts</span>
              </div>
              <p className="text-slate-300">
                Your coordinates (<strong className="text-white">{currentLocation?.latitude.toFixed(4)}, {currentLocation?.longitude.toFixed(4)}</strong>) have been dispatched via SMS.
              </p>
              <p className="text-slate-400 text-[11px]">
                ℹ️ When your contacts tap the link in their SMS, Google Maps will automatically open on their phone with <strong className="text-slate-300">Start: Their Present Location</strong> ➔ <strong className="text-slate-300">Destination: Your Location</strong>.
              </p>
            </div>

            {/* Status Report from Server */}
            {sendResult && (
              <div className="text-xs bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-slate-300 space-y-2">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Broadcast Status:
                </p>
                <p className="text-slate-300">{sendResult.message}</p>
                
                {sendResult.mode === 'simulated' && (
                  <div className="bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-lg text-amber-300 space-y-2">
                    <p className="font-bold text-[11px]">
                      ⚠️ To send direct cellular SMS without opening an app:
                    </p>
                    <p className="text-[11px]">
                      Computers don't have SIM cards. Click below to add a free Fast2SMS (India) or Twilio API key.
                    </p>
                    <button
                      onClick={onOpenSmsConfig}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Configure Direct SMS Gateway
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 1-Tap Direct Contact Messaging */}
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Send Instantly to Your Contacts Now:
              </p>
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{contact.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{contact.phone}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => currentLocation && openWhatsAppSOS(contact, currentLocation)}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Send WhatsApp
                      </button>
                      <button
                        onClick={() => currentLocation && openDeviceSMS([contact], currentLocation)}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Send SMS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
