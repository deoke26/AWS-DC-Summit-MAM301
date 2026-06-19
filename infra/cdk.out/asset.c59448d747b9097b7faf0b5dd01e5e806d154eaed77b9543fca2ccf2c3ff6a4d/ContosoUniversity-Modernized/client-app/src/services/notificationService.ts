import { get, post } from './httpClient';
import type { Notification } from '../types/notification';

export async function getNotifications(): Promise<Notification[]> {
  return get<Notification[]>('/notifications');
}

export async function markAsRead(id: number): Promise<void> {
  await post<void>(`/notifications/${id}/mark-read`);
}
