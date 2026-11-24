import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Heart, AlertOctagon, HelpCircle } from 'lucide-react';

export const SafetyTipsAI: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<'stalking' | 'medical' | 'accident' | 'domestic'>('stalking');

  const tips = {
    stalking: {
      title: 'Being Followed or In Danger',
      steps: [
        'Do not go straight home; move toward a crowded public place like a store, restaurant, or gas station.',
        'Trigger SafeWay SOS to send your real-time coordinates to family.',
        'Keep your phone unlocked and ready; call 112 or local police.',
        'Stay on well-lit main streets and never take isolated shortcuts.',
      ],
    },
    medical: {
      title: 'Medical Emergency / Unconscious Person',
      steps: [
        'Call 108 or 112 immediately and state your exact location.',
        'Check responsiveness and breathing; begin CPR if trained and necessary.',
        'Do not move someone with suspected spinal or head trauma unless they are in immediate hazard.',
        'Keep the person warm, comfortable, and speak to them calmly until help arrives.',
      ],
    },
    accident: {
      title: 'Road / Vehicle Incident',
      steps: [
        'Turn on hazard lights and ensure the area is safe before exiting.',
        'Broadcast your location using the SOS button so your relatives know where you are.',
        'Check yourself and passengers for injuries before attempting to help others.',
        'Call 100 for police and 108 for medical assistance.',
      ],
    },
    domestic: {
      title: 'Emergency Domestic Threat',
      steps: [
        'Identify a clear exit path and leave the premises immediately if safe to do so.',
        'Keep your vehicle keys and phone within easy reach.',
        'Dial Women Safety (1091) or Emergency Services (112).',
        'Head directly to a trusted neighbor or local police station.',
      ],
    },
  };

  const active = tips[selectedTopic];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Emergency Safety Guide</h3>
          <p className="text-xs text-slate-400">Critical action steps for high-threat scenarios</p>
        </div>
      </div>

      {/* Selector Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'stalking', label: 'Being Followed' },
          { key: 'medical', label: 'Medical Emergency' },
          { key: 'accident', label: 'Road Accident' },
          { key: 'domestic', label: 'Safety Threat' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTopic(tab.key as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedTopic === tab.key
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Guide Content */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
        <h4 className="text-sm font-bold text-slate-200 mb-2.5 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          {active.title}
        </h4>
        <ul className="space-y-2">
          {active.steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
