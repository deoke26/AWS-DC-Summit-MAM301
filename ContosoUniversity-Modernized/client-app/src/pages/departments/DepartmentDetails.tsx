import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Paper, Button } from '@mui/material';
import { getDepartment } from '../../services/departmentService';
import type { Department } from '../../types/department';
import LoadingIndicator from '../../components/LoadingIndicator';

export default function DepartmentDetails() {
  const { id } = useParams<{ id: string }>();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDepartment() {
      setLoading(true);
      try {
        const data = await getDepartment(Number(id));
        setDepartment(data);
      } finally {
        setLoading(false);
      }
    }
    fetchDepartment();
  }, [id]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!department) {
    return <Typography>Department not found.</Typography>;
  }

  const formattedBudget = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(department.budget);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Department Details
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Name:</strong> {department.name}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Budget:</strong> {formattedBudget}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Start Date:</strong>{' '}
          {new Date(department.startDate).toLocaleDateString()}
        </Typography>
        <Typography variant="body1">
          <strong>Administrator:</strong>{' '}
          {department.administratorName ?? 'None'}
        </Typography>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Button variant="outlined" component={Link} to="/departments">
          Back to List
        </Button>
      </Box>
    </Box>
  );
}
