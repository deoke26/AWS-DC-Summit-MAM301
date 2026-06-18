import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { createCourse } from '../../services/courseService';
import { getDepartments } from '../../services/departmentService';
import type { Department } from '../../types/department';
import type { ValidationError } from '../../types/common';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function CourseCreate() {
  const navigate = useNavigate();

  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [credits, setCredits] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getDepartments()
      .then((data) => setDepartments(data))
      .catch(() => {
        // Error notification handled by httpClient interceptor
      })
      .finally(() => setLoadingDepartments(false));
  }, []);

  function validateFile(selectedFile: File): string | null {
    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Allowed file types: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      return 'Maximum file size is 5 MB';
    }
    return null;
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
    if (selectedFile) {
      const fileError = validateFile(selectedFile);
      if (fileError) {
        setErrors((prev) => ({ ...prev, file: fileError }));
      } else {
        setErrors((prev) => {
          const { file: _removed, ...rest } = prev;
          void _removed;
          return rest;
        });
      }
    } else {
      setErrors((prev) => {
        const { file: _removed, ...rest } = prev;
        void _removed;
        return rest;
      });
    }
  }

  function handleDepartmentChange(e: SelectChangeEvent) {
    setDepartmentId(e.target.value);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    // Client-side file validation
    if (file) {
      const fileError = validateFile(file);
      if (fileError) {
        setErrors({ file: fileError });
        return;
      }
    }

    const formData = new FormData();
    formData.append('courseId', courseId);
    formData.append('title', title);
    formData.append('credits', credits);
    formData.append('departmentId', departmentId);
    if (file) {
      formData.append('file', file);
    }

    setLoading(true);
    try {
      await createCourse(formData);
      navigate('/courses');
    } catch (err: unknown) {
      if (Array.isArray(err)) {
        const fieldErrors: Record<string, string> = {};
        (err as ValidationError[]).forEach((ve) => {
          fieldErrors[ve.field.toLowerCase()] = ve.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loadingDepartments) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Create Course
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Course Number"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          error={!!errors['courseid']}
          helperText={errors['courseid'] || ''}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={!!errors['title']}
          helperText={errors['title'] || ''}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Credits"
          type="number"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          error={!!errors['credits']}
          helperText={errors['credits'] || ''}
          fullWidth
          margin="normal"
          required
          slotProps={{ htmlInput: { min: 0, max: 5 } }}
        />
        <FormControl
          fullWidth
          margin="normal"
          error={!!errors['departmentid']}
          required
        >
          <InputLabel id="department-label">Department</InputLabel>
          <Select
            labelId="department-label"
            value={departmentId}
            onChange={handleDepartmentChange}
            label="Department"
          >
            {departments.map((dept) => (
              <MenuItem key={dept.departmentId} value={String(dept.departmentId)}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
          {errors['departmentid'] && (
            <FormHelperText>{errors['departmentid']}</FormHelperText>
          )}
        </FormControl>
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Teaching Material Image (optional)
          </Typography>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.bmp"
            onChange={handleFileChange}
          />
          {errors['file'] && (
            <FormHelperText error>{errors['file']}</FormHelperText>
          )}
        </Box>
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
          <Button
            component={RouterLink}
            to="/courses"
            variant="outlined"
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
