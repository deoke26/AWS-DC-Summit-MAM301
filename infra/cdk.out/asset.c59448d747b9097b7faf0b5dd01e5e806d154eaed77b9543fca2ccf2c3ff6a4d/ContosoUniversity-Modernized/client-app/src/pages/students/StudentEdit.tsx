import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import { getStudent, updateStudent } from '../../services/studentService';
import type { ValidationError } from '../../types/common';

export default function StudentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lastName, setLastName] = useState('');
  const [firstMidName, setFirstMidName] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchStudent() {
      try {
        const student = await getStudent(Number(id));
        setLastName(student.lastName);
        setFirstMidName(student.firstMidName);
        // enrollmentDate comes as ISO 8601 — extract the date portion for input[type=date]
        setEnrollmentDate(student.enrollmentDate.substring(0, 10));
      } catch {
        // 404 is handled by the httpClient interceptor (redirects to /not-found)
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [id]);

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
      await updateStudent(Number(id), { lastName, firstMidName, enrollmentDate });
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Edit Student
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
            Save
          </Button>
          <Button variant="outlined" onClick={() => navigate('/students')}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
