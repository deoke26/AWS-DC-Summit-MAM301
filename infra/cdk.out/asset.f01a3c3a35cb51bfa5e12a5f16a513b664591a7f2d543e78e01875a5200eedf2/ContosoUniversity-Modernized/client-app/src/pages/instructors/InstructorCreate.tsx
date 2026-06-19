import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { createInstructor } from '../../services/instructorService';
import { getCourses } from '../../services/courseService';
import type { Course } from '../../types/course';
import type { ValidationError } from '../../types/common';

export default function InstructorCreate() {
  const navigate = useNavigate();
  const [lastName, setLastName] = useState('');
  const [firstMidName, setFirstMidName] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const data = await getCourses();
        setCourses(data);
      } catch {
        // Error handled by httpClient interceptor
      } finally {
        setLoadingCourses(false);
      }
    }
    fetchCourses();
  }, []);

  function getFieldError(field: string): string {
    const lower = field.toLowerCase();
    for (const [key, value] of Object.entries(errors)) {
      if (key.toLowerCase() === lower) return value;
    }
    return '';
  }

  function handleCourseToggle(courseId: number) {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      await createInstructor({
        lastName,
        firstMidName,
        hireDate,
        officeLocation: officeLocation || null,
        courseIds: selectedCourseIds,
      });
      navigate('/instructors');
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
        Create Instructor
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
          label="Hire Date"
          type="date"
          value={hireDate}
          onChange={(e) => setHireDate(e.target.value)}
          error={!!getFieldError('hireDate')}
          helperText={getFieldError('hireDate')}
          fullWidth
          margin="normal"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Office Location"
          value={officeLocation}
          onChange={(e) => setOfficeLocation(e.target.value)}
          error={!!getFieldError('officeLocation')}
          helperText={getFieldError('officeLocation')}
          fullWidth
          margin="normal"
          slotProps={{ htmlInput: { maxLength: 50 } }}
        />
        <FormControl component="fieldset" sx={{ mt: 2 }} fullWidth>
          <FormLabel component="legend">Courses</FormLabel>
          {loadingCourses ? (
            <CircularProgress size={24} sx={{ mt: 1 }} />
          ) : (
            <FormGroup>
              {courses.map((course) => (
                <FormControlLabel
                  key={course.courseId}
                  control={
                    <Checkbox
                      checked={selectedCourseIds.includes(course.courseId)}
                      onChange={() => handleCourseToggle(course.courseId)}
                    />
                  }
                  label={course.title}
                />
              ))}
            </FormGroup>
          )}
        </FormControl>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : undefined}
          >
            Create
          </Button>
          <Button variant="outlined" onClick={() => navigate('/instructors')}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
