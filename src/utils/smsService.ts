import { TrustedContact, LocationData, UserProfile } from '../types';

export const generateDirectionsLink = (lat: number, lng: number): string => {
  // Google Maps native navigation scheme (daddr = destination address).
  // Automatically defaults starting point to the receiver's live GPS location.
  return `https://maps.google.com/maps?daddr=${lat},${lng}`;
};

export const generateMapsLink = (lat: number, lng: number): string => {
  return generateDirectionsLink(lat, lng);
};

export const formatSOSMessage = (
  location: LocationData,
  user?: UserProfile | null,
  customNote?: string
): string => {
  const navLink = generateDirectionsLink(location.latitude, location.longitude);
  const time = new Date(location.timestamp).toLocaleTimeString();
  const notePart = customNote ? `\nNote: ${customNote}` : '';
  const fromPart = user?.name
    ? `\nFROM: ${user.name.toUpperCase()}${user.phone ? ` (${user.phone})` : ''}`
    : '';
  const bloodPart = user?.bloodGroup ? `\nBlood Group: ${user.bloodGroup}` : '';

  return `🚨 EMERGENCY SOS ALERT! 🚨${fromPart}${bloodPart}\nI need urgent help! Tap this link to navigate directly to my live location:\n👉 ${navLink}\n\n(GPS Accuracy: ~${Math.round(location.accuracy)}m at ${time})${notePart}\nPlease hurry or send emergency services!`;
};

// Dispatch via Backend API (Twilio / Gateway)
export const sendBackendSOSAlert = async (
  contacts: TrustedContact[],
  location: LocationData,
  user?: UserProfile | null,
  customNote?: string
): Promise<{ success: boolean; message: string; results?: any[] }> => {
  try {
    const response = await fetch('/api/sos/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: contacts.map(c => ({ name: c.name, phone: c.phone })),
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        senderName: user?.name,
        senderPhone: user?.phone,
        bloodGroup: user?.bloodGroup,
        customNote,
      }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to reach backend server',
    };
  }
};

// Direct Device SMS launcher (Zero-cost native phone messaging app)
export const openDeviceSMS = (
  contacts: TrustedContact[],
  location: LocationData,
  user?: UserProfile | null,
  customNote?: string
) => {
  const phoneNumbers = contacts.map(c => c.phone.trim()).join(';'); // Android and iOS delimiter
  const message = encodeURIComponent(formatSOSMessage(location, user, customNote));
  
  // iOS uses &body=, Android/desktop uses ?body=
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';

  const smsUrl = `sms:${phoneNumbers}${separator}body=${message}`;
  window.open(smsUrl, '_blank');
};

// WhatsApp SOS launcher
export const openWhatsAppSOS = (
  contact: TrustedContact,
  location: LocationData,
  user?: UserProfile | null,
  customNote?: string
) => {
  const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
  const message = encodeURIComponent(formatSOSMessage(location, user, customNote));
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
};
