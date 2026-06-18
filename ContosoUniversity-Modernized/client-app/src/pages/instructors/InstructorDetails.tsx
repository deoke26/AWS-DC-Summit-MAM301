import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import { getInstructor } from '../../services/instructorService';
import type { InstructorDetail } from '../../types/instructor';
import LoadingIndicator from '../../components/LoadingIndicator';

export default function InstructorDetails() {
  const { id } = useParams<{ id: string }>();
  const [instructor, setInstructor] = useState<InstructorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInstructor() {
      setLoading(true);
      try {
        const data = await getInstructor(Number(id));
        setInstructor(data);
      } finally {
        setLoading(false);
      }
    }
    fetchInstructor();
  }, [id]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!instructor) {
    return <Typography>Instructor not found.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Instructor Details
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Last Name:</strong> {instructor.lastName}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>First Name:</strong> {instructor.firstMidName}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Hire Date:</strong>{' '}
          {new Date(instructor.hireDate).toLocaleDateString()}
        </Typography>
        <Typography variant="body1">
          <strong>Office Location:</strong>{' '}
          {instructor.officeLocation ?? 'None'}
        </Typography>
      </Paper>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Assigned Courses
      </Typography>

      {instructor.courses.length === 0 ? (
        <Typography>No courses assigned.</Typography>
      ) : (
        <Paper>
          <List>
            {instructor.courses.map((course) => (
              <ListItem key={course.courseId}>
                <ListItemText primary={course.title} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Box sx={{ mt: 3 }}>
        <Button variant="outlined" component={Link} to="/instructors">
          Back to List
        </Button>
      </Box>
    </Box>
  );
}
