
export enum DocumentStatus {
  PendingReceipt = 'ค้างรับ',
  Received = 'รับแล้ว',
}

export interface Document {
  id: string;
  documentNumber: string;
  item: string; // Renamed from title
  payee: string; // New field
  amount: number; // New field
  sender: string;
  submittedAt: Date;
  status: DocumentStatus;
  receivedBy?: string;
  receivedAt?: Date;
}
