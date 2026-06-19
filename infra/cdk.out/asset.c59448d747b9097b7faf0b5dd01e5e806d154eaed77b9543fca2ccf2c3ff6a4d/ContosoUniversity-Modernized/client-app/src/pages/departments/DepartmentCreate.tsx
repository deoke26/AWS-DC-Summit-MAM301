import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { createDepartment } from '../../services/departmentService';
import { getInstructors } from '../../services/instructorService';
import type { Instructor } from '../../types/instructor';
import type { ValidationError } from '../../types/common';
import LoadingIndicator from '../../components/LoadingIndicator';

export default function DepartmentCreate() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [instructorId, setInstructorId] = useState<string>('');
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    getInstructors()
      .then(setInstructors)
      .finally(() => setLoading(false));
  }, []);

  function getFieldError(field: string): string | undefined {
    const key = Object.keys(fieldErrors).find(
      (k) => k.toLowerCase() === field.toLowerCase()
    );
    return key ? fieldErrors[key] : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    try {
      await createDepartment({
        name,
        budget: parseFloat(budget) || 0,
        startDate,
        instructorId: instructorId ? parseInt(instructorId, 10) : null,
      });
      navigate('/departments');
    } catch (err: unknown) {
      if (Array.isArray(err)) {
        const errors: Record<string, string> = {};
        (err as ValidationError[]).forEach((ve) => {
          errors[ve.field] = ve.message;
        });
        setFieldErrors(errors);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Create Department
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
          error={!!getFieldError('name')}
          helperText={getFieldError('name')}
        />
        <TextField
          label="Budget"
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          fullWidth
          margin="normal"
          error={!!getFieldError('budget')}
          helperText={getFieldError('budget')}
        />
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          fullWidth
          margin="normal"
          slotProps={{ inputLabel: { shrink: true } }}
          error={!!getFieldError('startDate')}
          helperText={getFieldError('startDate')}
        />
        <FormControl fullWidth margin="normal" error={!!getFieldError('instructorId')}>
          <InputLabel id="administrator-label">Administrator</InputLabel>
          <Select
            labelId="administrator-label"
            value={instructorId}
            label="Administrator"
            onChange={(e: SelectChangeEvent) => setInstructorId(e.target.value)}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {instructors.map((inst) => (
              <MenuItem key={inst.id} value={String(inst.id)}>
                {inst.lastName}, {inst.firstMidName}
              </MenuItem>
            ))}
          </Select>
          {getFieldError('instructorId') && (
            <Typography variant="caption" color="error">
              {getFieldError('instructorId')}
            </Typography>
          )}
        </FormControl>

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/departments')}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
