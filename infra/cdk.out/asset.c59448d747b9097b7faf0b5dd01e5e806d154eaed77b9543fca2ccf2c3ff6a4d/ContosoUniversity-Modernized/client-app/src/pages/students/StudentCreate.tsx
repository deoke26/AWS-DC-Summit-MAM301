import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import { createStudent } from '../../services/studentService';
import type { ValidationError } from '../../types/common';

export default function StudentCreate() {
  const navigate = useNavigate();
  const [lastName, setLastName] = useState('');
  const [firstMidName, setFirstMidName] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function getFieldError(field: string): string {
    const lower = field.toLowerCase();
    for (const [key, value] of Object.entries(errors)) {
      if (key.toLowerCase() === lower) return value;
    }
    return '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      await createStudent({ lastName, firstMidName, enrollmentDate });
      navigate('/students');
    } catch (err: unknown) {
      if (Array.isArray(err)) {
        const fieldErrors: Record<string, string> = {};
        (err as ValidationError[]).forEach((ve) => {
          fieldErrors[ve.field] = ve.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create Student
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          error={!!getFieldError('lastName')}
          helperText={getFieldError('lastName')}
          fullWidth
          margin="normal"
          slotProps={{ htmlInput: { maxLength: 50 } }}
        />
        <TextField
          label="First Name"
          value={firstMidName}
          onChange={(e) => setFirstMidName(e.target.value)}
          error={!!getFieldError('firstMidName')}
          helperText={getFieldError('firstMidName')}
          fullWidth
          margin="normal"
          slotProps={{ htmlInput: { maxLength: 50 } }}
        />
        <TextField
          label="Enrollment Date"
          type="date"
          value={enrollmentDate}
          onChange={(e) => setEnrollmentDate(e.target.value)}
          error={!!getFieldError('enrollmentDate')}
          helperText={getFieldError('enrollmentDate')}
          fullWidth
          margin="normal"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : undefined}
          >
            Create
          </Button>
          <Button variant="outlined" onClick={() => navigate('/students')}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
