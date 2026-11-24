import React, { useState } from 'react';
import { UserPlus, Trash2, Phone, Heart, Shield, MessageCircle, AlertCircle } from 'lucide-react';
import { TrustedContact } from '../types';
import { openWhatsAppSOS } from '../utils/smsService';

interface Props {
  contacts: TrustedContact[];
  onAddContact: (contact: Omit<TrustedContact, 'id'>) => void;
  onDeleteContact: (id: string) => void;
}

export const TrustedContacts: React.FC<Props> = ({ contacts, onAddContact, onDeleteContact }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Family');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please provide both name and phone number');
      return;
    }

    onAddContact({
      name: name.trim(),
      phone: phone.trim(),
      relationship,
    });

    setName('');
    setPhone('');
    setRelationship('Family');
    setShowAddForm(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Trusted Contacts</h3>
            <p className="text-xs text-slate-400">These people receive your emergency SMS alert</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
        >
          <UserPlus className="w-4 h-4 text-sky-400" />
          {showAddForm ? 'Cancel' : 'Add Contact'}
        </button>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">New Contact Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Mom, Brother, Sarah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Mobile Number (Include Country Code)
              </label>
              <input
                type="tel"
                placeholder="e.g. +919876543210 or 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Relationship</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="Family">Family / Parent</option>
              <option value="Friend">Close Friend</option>
              <option value="Partner">Spouse / Partner</option>
              <option value="Colleague">Colleague / Neighbor</option>
              <option value="Doctor">Doctor / Caregiver</option>
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/30"
            >
              Save Trusted Contact
            </button>
          </div>
        </form>
      )}

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No Trusted Contacts Added Yet</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            Add at least one phone number so your emergency location can be delivered via SMS.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 rounded-2xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-sm">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{contact.name}</p>
                    <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      {contact.relationship}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-500" />
                    {contact.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${contact.phone}`}
                  title="Call contact"
                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button
                  onClick={() => onDeleteContact(contact.id)}
                  title="Delete contact"
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
