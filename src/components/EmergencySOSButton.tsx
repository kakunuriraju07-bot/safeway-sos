import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, MapPin, Volume2, VolumeX, MessageSquare, PhoneCall, ExternalLink, ShieldCheck, CheckCircle2, Settings, Send, Navigation, AlertOctagon, RefreshCw, User, LogIn } from 'lucide-react';
import { TrustedContact, LocationData, UserProfile } from '../types';
import { sendBackendSOSAlert, openDeviceSMS, openWhatsAppSOS, generateDirectionsLink } from '../utils/smsService';
import { startSiren, stopSiren } from '../utils/audioSiren';

interface Props {
  contacts: TrustedContact[];
  userProfile?: UserProfile | null;
  onOpenAuthModal?: () => void;
  onOpenSmsConfig: () => void;
  onAlertTriggered?: (location: LocationData) => void;
}

export const EmergencySOSButton: React.FC<Props> = ({
  contacts,
  userProfile,
  onOpenAuthModal,
  onOpenSmsConfig,
  onAlertTriggered,
}) => {
  const [isAlerting, setIsAlerting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'locating' | 'ready' | 'error' | 'insecure'>('prompt');
  const [statusMessage, setStatusMessage] = useState<string>('GPS Not Initialized. Tap button to activate.');
  const [sirenActive, setSirenActive] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string; mode?: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for Secure Context (HTTPS or localhost is required for Geolocation API)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!window.isSecureContext && !isLocal) {
      setLocationStatus('insecure');
      setStatusMessage('⚠️ Geolocation requires HTTPS. Please access via the HTTPS secure link.');
      return;
    }

    // Attempt permission query if supported
    if ('permissions' in navigator && (navigator as any).permissions.query) {
      (navigator as any).permissions.query({ name: 'geolocation' }).then((result: any) => {
        if (result.state === 'granted') {
          requestLiveGPS();
        } else if (result.state === 'denied') {
          setLocationStatus('error');
          setStatusMessage('Location permission denied. Please allow location in your phone/browser settings.');
        } else {
          setLocationStatus('prompt');
          setStatusMessage('Tap "Enable Live GPS" to grant location permission.');
        }

        result.onchange = () => {
          if (result.state === 'granted') {
            requestLiveGPS();
          } else if (result.state === 'denied') {
            setLocationStatus('error');
            setStatusMessage('Location permission denied.');
          }
        };
      }).catch(() => {
        requestLiveGPS();
      });
    } else {
      requestLiveGPS();
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Request fresh GPS fix with user gesture
  const requestLiveGPS = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setLocationStatus('error');
        const err = new Error('Geolocation is not supported on this device/browser.');
        setStatusMessage(err.message);
        return reject(err);
      }

      setIsLocating(true);
      setLocationStatus('locating');
      setStatusMessage('Requesting GPS satellites for high accuracy...');

      const onSuccess = (pos: GeolocationPosition) => {
        setIsLocating(false);
        const loc: LocationData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setCurrentLocation(loc);
        setLocationStatus('ready');
        setStatusMessage(`GPS Locked (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`);
        if (onAlertTriggered) onAlertTriggered(loc);

        // Start watching position continuously
        if (watchIdRef.current === null) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (watchPos) => {
              const updatedLoc: LocationData = {
                latitude: watchPos.coords.latitude,
                longitude: watchPos.coords.longitude,
                accuracy: watchPos.coords.accuracy,
                timestamp: watchPos.timestamp,
              };
              setCurrentLocation(updatedLoc);
              if (onAlertTriggered) onAlertTriggered(updatedLoc);
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 5000 }
          );
        }

        resolve(loc);
      };

      const onError = (err: GeolocationPositionError) => {
        console.warn('High accuracy GPS timed out, trying standard GPS...', err);
        // Fallback to low-power / cell tower geolocation if high accuracy times out
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (finalErr) => {
            setIsLocating(false);
            setLocationStatus('error');
            let msg = 'Failed to get location.';
            if (finalErr.code === 1) {
              msg = 'Location permission was denied. Please open Settings -> Apps -> SafeWay -> Allow Location.';
            } else if (finalErr.code === 2) {
              msg = 'GPS signal unavailable. Please ensure GPS/Location is turned ON in your phone toggle bar.';
            } else if (finalErr.code === 3) {
              msg = 'GPS request timed out. Please step outdoors or refresh.';
            }
            setStatusMessage(msg);
            reject(finalErr);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
        );
      };

      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  };

  const handleStartSOS = async () => {
    if (contacts.length === 0) {
      alert('Please add at least 1 trusted contact first!');
      return;
    }

    setIsAlerting(true);
    setSirenActive(true);
    startSiren();

    let locToSend = currentLocation;

    // If we don't have a fresh GPS fix yet, actively acquire it NOW during the button click!
    if (!locToSend || locationStatus !== 'ready') {
      try {
        locToSend = await requestLiveGPS();
      } catch (err: any) {
        console.error('Failed to get GPS on click:', err);
        alert(
          '⚠️ GPS location could not be determined!\n\n' +
          'Please ensure:\n' +
          '1. Device Location/GPS is turned ON.\n' +
          '2. You tapped "Allow" on the browser/app location permission popup.\n\n' +
          'Attempting emergency broadcast with last known position...'
        );
      }
    }

    const finalLoc = locToSend || {
      latitude: 17.3914,
      longitude: 78.4795,
      accuracy: 25,
      timestamp: Date.now(),
    };

    if (onAlertTriggered) {
      onAlertTriggered(finalLoc);
    }

    // 1. Dispatch through backend API (Twilio / Fast2SMS) with user profile
    const res = await sendBackendSOSAlert(contacts, finalLoc, userProfile);
    setSendResult(res);

    // 2. If mobile device, automatically open native SMS app with user profile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      openDeviceSMS(contacts, finalLoc, userProfile);
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {isAlerting && (
        <div className="absolute inset-0 bg-red-600/10 animate-pulse pointer-events-none" />
      )}

      <div className="text-center max-w-lg mx-auto">
        {/* GPS Sensor Status Bar */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 mb-4">
          <MapPin className={`w-3.5 h-3.5 ${
            locationStatus === 'ready' ? 'text-emerald-400' :
            locationStatus === 'locating' ? 'text-sky-400 animate-spin' :
            locationStatus === 'insecure' ? 'text-rose-400' : 'text-amber-400'
          }`} />
          
          {locationStatus === 'ready' && currentLocation ? (
            <span className="text-emerald-400 font-mono">
              Live GPS: {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)} (±{Math.round(currentLocation.accuracy)}m)
            </span>
          ) : locationStatus === 'locating' ? (
            <span className="text-sky-400 animate-pulse">Locking onto GPS satellites...</span>
          ) : locationStatus === 'insecure' ? (
            <span className="text-rose-400">HTTPS Required for GPS</span>
          ) : (
            <span className="text-amber-300">GPS Inactive</span>
          )}

          <button
            onClick={() => requestLiveGPS()}
            disabled={isLocating}
            className="underline text-sky-400 ml-1 hover:text-sky-300 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
            {locationStatus === 'ready' ? 'Update' : 'Enable GPS'}
          </button>
        </div>

        {/* Informative Status / Warning Box */}
        {locationStatus !== 'ready' && (
          <div className={`text-xs rounded-xl p-3 mb-4 text-left border ${
            locationStatus === 'error'
              ? 'bg-rose-950/40 border-rose-800/50 text-rose-300'
              : locationStatus === 'insecure'
              ? 'bg-red-950/60 border-red-700 text-red-200'
              : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
          }`}>
            <div className="flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-bold">GPS Permission Needed:</p>
                <p className="text-[11px] mt-0.5 opacity-90">{statusMessage}</p>
                {locationStatus !== 'insecure' && (
                  <button
                    onClick={() => requestLiveGPS()}
                    className="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    Tap to Grant Location Permission
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Profile Banner */}
        <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
          <User className="w-3.5 h-3.5 text-rose-400" />
          {userProfile?.name ? (
            <span>
              Emergency Sender: <strong className="text-white">{userProfile.name}</strong> {userProfile.phone && `(${userProfile.phone})`} {userProfile.bloodGroup && <span className="bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded text-[10px] ml-1 font-bold">{userProfile.bloodGroup}</span>}
            </span>
          ) : (
            <span>
              Sender Profile: <strong className="text-slate-400">Not Logged In</strong>
            </span>
          )}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="ml-1 text-[11px] text-sky-400 hover:text-sky-300 underline font-semibold"
            >
              {userProfile?.name ? 'Edit Profile' : 'Login / Set Name'}
            </button>
          )}
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
          Emergency Location Broadcast
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Pressing the SOS button captures your exact live GPS coordinates and instantly delivers navigation instructions to all <strong className="text-white">{contacts.length} trusted contacts</strong>.
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

            {/* Sender Broadcast Status */}
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Live Location Sent to Contacts</span>
              </div>
              <p className="text-slate-300">
                Your coordinates (<strong className="text-white">{currentLocation?.latitude.toFixed(5)}, {currentLocation?.longitude.toFixed(5)}</strong>) have been dispatched via SMS.
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
                        onClick={() => currentLocation && openWhatsAppSOS(contact, currentLocation, userProfile)}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Send WhatsApp
                      </button>
                      <button
                        onClick={() => currentLocation && openDeviceSMS([contact], currentLocation, userProfile)}
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
