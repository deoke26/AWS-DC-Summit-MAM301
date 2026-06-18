import { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { HTTP_ERROR_EVENT } from '../services/httpClient';
import type { HttpErrorDetail } from '../services/httpClient';

export default function ErrorNotification() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [autoDismissMs, setAutoDismissMs] = useState(8000);

  useEffect(() => {
    function handleHttpError(event: Event) {
      const customEvent = event as CustomEvent<HttpErrorDetail>;
      setMessage(customEvent.detail.message);
      setAutoDismissMs(customEvent.detail.autoDismissMs);
      setOpen(true);
    }

    window.addEventListener(HTTP_ERROR_EVENT, handleHttpError);
    return () => {
      window.removeEventListener(HTTP_ERROR_EVENT, handleHttpError);
    };
  }, []);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoDismissMs}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={handleClose} severity="error" variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
