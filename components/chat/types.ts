export interface Message {
  _id: string; sender: string; receiver: string;
  messageType: 'text' | 'image' | 'document' | 'location' | 'voice' | 'emoji' | 'sticker';
  content?: string; fileUrl?: string; fileName?: string;
  location?: { lat: number; lng: number; address?: string };
  createdAt: string; status?: 'pending' | 'sent' | 'error';
}
