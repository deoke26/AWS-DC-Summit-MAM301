import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { getDepartment, updateDepartment } from '../../services/departmentService';
import { getInstructors } from '../../services/instructorService';
import type { ConcurrencyConflict } from '../../types/department';
import type { Instructor } from '../../types/instructor';
import type { ValidationError } from '../../types/common';
import LoadingIndicator from '../../components/LoadingIndicator';

export default function DepartmentEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [instructorId, setInstructorId] = useState<string>('');
  const [rowVersion, setRowVersion] = useState('');
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState<ConcurrencyConflict | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [dept, instrList] = await Promise.all([
          getDepartment(parseInt(id!, 10)),
          getInstructors(),
        ]);
        setName(dept.name);
        setBudget(String(dept.budget));
        setStartDate(dept.startDate.split('T')[0]);
        setInstructorId(dept.instructorId ? String(dept.instructorId) : '');
        setRowVersion(dept.rowVersion);
        setInstructors(instrList);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function getFieldError(field: string): string | undefined {
    const key = Object.keys(fieldErrors).find(
      (k) => k.toLowerCase() === field.toLowerCase()
    );
    return key ? fieldErrors[key] : undefined;
  }

  function getInstructorName(instrId: number | null): string {
    if (!instrId) return '(None)';
    const inst = instructors.find((i) => i.id === instrId);
    return inst ? `${inst.lastName}, ${inst.firstMidName}` : '(Unknown)';
  }

  function formatBudget(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  function handleAcceptDatabaseValues() {
    if (!conflict) return;
    const db = conflict.currentValues;
    setName(db.name);
    setBudget(String(db.budget));
    setStartDate(db.startDate.split('T')[0]);
    setInstructorId(db.instructorId ? String(db.instructorId) : '');
    setRowVersion(db.rowVersion);
    setConflict(null);
    setFieldErrors({});
  }

  function handleRetryWithUpdatedRowVersion() {
    if (!conflict) return;
    setRowVersion(conflict.currentValues.rowVersion);
    setConflict(null);
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setConflict(null);
    setSubmitting(true);

    try {
      await updateDepartment(parseInt(id!, 10), {
        name,
        budget: parseFloat(budget) || 0,
        startDate,
        instructorId: instructorId ? parseInt(instructorId, 10) : null,
        rowVersion,
      });
      navigate('/departments');
    } catch (err: unknown) {
      if (Array.isArray(err)) {
        // 400 validation errors
        const errors: Record<string, string> = {};
        (err as ValidationError[]).forEach((ve) => {
          errors[ve.field] = ve.message;
        });
        setFieldErrors(errors);
      } else if (
        err &&
        typeof err === 'object' &&
        'currentValues' in err &&
        'message' in err
      ) {
        // 409 concurrency conflict
        setConflict(err as ConcurrencyConflict);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Edit Department
      </Typography>

      {conflict && (
        <Paper sx={{ p: 2, mb: 3 }} elevation={3}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {conflict.message}
          </Alert>
          <Typography variant="h6" gutterBottom>
            Concurrency Conflict
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Field</strong></TableCell>
                  <TableCell><strong>Database Values</strong></TableCell>
                  <TableCell><strong>Your Values</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>{conflict.currentValues.name}</TableCell>
                  <TableCell>{name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Budget</TableCell>
                  <TableCell>{formatBudget(conflict.currentValues.budget)}</TableCell>
                  <TableCell>{formatBudget(parseFloat(budget) || 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Start Date</TableCell>
                  <TableCell>{conflict.currentValues.startDate.split('T')[0]}</TableCell>
                  <TableCell>{startDate}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Administrator</TableCell>
                  <TableCell>
                    {getInstructorName(conflict.currentValues.instructorId)}
                  </TableCell>
                  <TableCell>
                    {getInstructorName(instructorId ? parseInt(instructorId, 10) : null)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleAcceptDatabaseValues}>
              Accept Database Values
            </Button>
            <Button variant="outlined" onClick={handleRetryWithUpdatedRowVersion}>
              Retry with My Values
            </Button>
          </Box>
        </Paper>
      )}

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
            {submitting ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/departments')}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
