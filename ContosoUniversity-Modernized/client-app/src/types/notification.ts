export interface Notification {
  id: number;
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  message: string;
  createdAt: string;
  createdBy: string;
  isRead: boolean;
}
