import React from 'react';
import { PhoneCall, ShieldAlert, HeartPulse, Flame, PhoneForwarded } from 'lucide-react';

export const EmergencyServices: React.FC = () => {
  const services = [
    { name: 'National Emergency (All-in-One)', number: '112', icon: ShieldAlert, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { name: 'Police Helpline', number: '100', icon: PhoneCall, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { name: 'Ambulance / Medical', number: '108', icon: HeartPulse, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'Women Safety Helpline', number: '1091', icon: PhoneForwarded, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { name: 'Fire Department', number: '101', icon: Flame, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
          <PhoneCall className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Emergency Hotlines</h3>
          <p className="text-xs text-slate-400">One-tap direct calls to emergency responders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {services.map((srv) => {
          const Icon = srv.icon;
          return (
            <a
              key={srv.number}
              href={`tel:${srv.number}`}
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 rounded-2xl group transition"
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${srv.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition">
                    {srv.name}
                  </p>
                  <p className="text-sm font-mono font-bold text-white">
                    {srv.number}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-400 opacity-0 group-hover:opacity-100 transition">
                Call
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};
