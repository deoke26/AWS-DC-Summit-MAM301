import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import { getStudent } from '../../services/studentService';
import type { StudentDetail } from '../../types/student';
import LoadingIndicator from '../../components/LoadingIndicator';

export default function StudentDetails() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudent() {
      setLoading(true);
      try {
        const data = await getStudent(Number(id));
        setStudent(data);
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [id]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!student) {
    return <Typography>Student not found.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Student Details
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Last Name:</strong> {student.lastName}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>First Name:</strong> {student.firstMidName}
        </Typography>
        <Typography variant="body1">
          <strong>Enrollment Date:</strong>{' '}
          {new Date(student.enrollmentDate).toLocaleDateString()}
        </Typography>
      </Paper>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Enrollments
      </Typography>

      {student.enrollments.length === 0 ? (
        <Typography>No enrollments found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course Name</TableCell>
                <TableCell>Grade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {student.enrollments.map((enrollment, index) => (
                <TableRow key={index}>
                  <TableCell>{enrollment.courseName}</TableCell>
                  <TableCell>{enrollment.grade ?? 'No grade'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 3 }}>
        <Button variant="outlined" component={Link} to="/students">
          Back to List
        </Button>
      </Box>
    </Box>
  );
}
