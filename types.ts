
export enum DocumentStatus {
  PendingReceipt = 'ค้างรับ',
  Received = 'รับแล้ว',
}

export type UserRole = 'sender' | 'receiver' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface HistoryEntry {
  timestamp: Date;
  user: string;
  action: string;
  message?: string;
}

export interface Document {
  id: string;
  documentNumber: string;
  item: string;
  payee: string;
  amount: number;
  sender: string;
  senderId: string;
  submittedAt: Date;
  status: DocumentStatus;
  receivedBy?: string;
  receivedById?: string;
  receivedAt?: Date;
  verificationCode: string; // Added for trust
  history: HistoryEntry[];
}
