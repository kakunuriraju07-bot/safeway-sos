export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary?: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  bloodGroup?: string;
  emergencyNotes?: string;
  authMethod: 'phone' | 'google' | 'guest';
  createdAt: number;
}

export interface AlertLog {
  id: string;
  timestamp: string;
  location: LocationData;
  recipientCount: number;
  status: 'sent' | 'pending' | 'failed';
  method: 'sms' | 'whatsapp' | 'device-sms' | 'api';
  details?: string;
}
