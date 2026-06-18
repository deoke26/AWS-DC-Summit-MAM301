import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Alert,
  Button,
  List,
  ListItem,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import { getNotifications, markAsRead } from '../../services/notificationService';
import type { Notification } from '../../types/notification';

const POLL_INTERVAL_MS = 5000;
const MAX_NOTIFICATIONS = 50;

export default function NotificationDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mergeNotifications = useCallback(
    (existing: Notification[], incoming: Notification[]): Notification[] => {
      const existingIds = new Set(existing.map((n) => n.id));
      const newItems = incoming.filter((n) => !existingIds.has(n.id));
      const merged = [...newItems, ...existing];
      merged.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return merged.slice(0, MAX_NOTIFICATIONS);
    },
    []
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications((prev) => mergeNotifications(prev, data));
      setError(null);
    } catch {
      setError('Could not load notifications. Will retry shortly.');
    }
  }, [mergeNotifications]);

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    // Optimistically update visual state
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    try {
      await markAsRead(id);
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
      setError('Failed to mark notification as read. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {notifications.length === 0 && !error && (
        <Typography color="text.secondary">No notifications to display.</Typography>
      )}

      <List>
        {notifications.map((notification) => (
          <ListItem key={notification.id} disablePadding sx={{ mb: 1 }}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                width: '100%',
                backgroundColor: notification.isRead ? undefined : '#e3f2fd',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {notification.entityType} &middot; {notification.operation} &middot;{' '}
                    {new Date(notification.createdAt).toLocaleString()} &middot; by{' '}
                    {notification.createdBy}
                  </Typography>
                </Box>
                {!notification.isRead && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleMarkAsRead(notification.id)}
                    sx={{ ml: 2, whiteSpace: 'nowrap' }}
                  >
                    Mark as Read
                  </Button>
                )}
              </Box>
            </Paper>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
