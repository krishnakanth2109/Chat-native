// types/index.ts

export interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture: string;
}

export interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  messageType: 'text' | 'image' | 'location' | 'voice' | 'document';
  fileUrl?: string;
  fileName?: string;
  location?: { lat: number; lng: number; address?: string };
  createdAt: string;
}

export interface AuthResponse {
  token: string;
}