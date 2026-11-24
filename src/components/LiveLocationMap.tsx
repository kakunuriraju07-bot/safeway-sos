import React from 'react';
import { MapPin, Navigation, ExternalLink, ShieldCheck, Copy, Check } from 'lucide-react';
import { LocationData } from '../types';
import { generateMapsLink } from '../utils/smsService';

interface Props {
  location: LocationData | null;
}

export const LiveLocationMap: React.FC<Props> = ({ location }) => {
  const [copied, setCopied] = React.useState(false);

  const lat = location?.latitude ?? 17.3850;
  const lng = location?.longitude ?? 78.4867;
  const mapsUrl = generateMapsLink(lat, lng);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mapsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Live Location Radar</h3>
            <p className="text-xs text-slate-400">High-precision GPS coordinates</p>
          </div>
        </div>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy Map Link'}
        </button>
      </div>

      {/* Embedded Map Display */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 aspect-[16/9] bg-slate-950 flex items-center justify-center">
        <iframe
          title="Live Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={`https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`}
          className="w-full h-full opacity-90 hover:opacity-100 transition"
        />
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-slate-200">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        </div>
      </div>

      {/* Quick Links & Info */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-slate-400">
          Accuracy: <span className="text-white font-semibold">±{location ? Math.round(location.accuracy) : 25} meters</span>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
        >
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span>View on Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
