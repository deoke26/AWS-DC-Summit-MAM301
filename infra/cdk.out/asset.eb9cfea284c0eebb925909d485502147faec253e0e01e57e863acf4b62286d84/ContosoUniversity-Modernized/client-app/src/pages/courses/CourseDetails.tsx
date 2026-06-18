import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Paper, Button } from '@mui/material';
import { getCourse } from '../../services/courseService';
import type { Course } from '../../types/course';
import LoadingIndicator from '../../components/LoadingIndicator';

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      setLoading(true);
      try {
        const data = await getCourse(Number(id));
        setCourse(data);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [id]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!course) {
    return <Typography>Course not found.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Course Details
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Course Number:</strong> {course.courseId}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Title:</strong> {course.title}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Credits:</strong> {course.credits}
        </Typography>
        <Typography variant="body1">
          <strong>Department:</strong> {course.departmentName}
        </Typography>
      </Paper>

      {course.teachingMaterialImagePath && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Teaching Material
          </Typography>
          <img
            src={course.teachingMaterialImagePath}
            alt={`Teaching material for ${course.title}`}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </Paper>
      )}

      <Box sx={{ mt: 3 }}>
        <Button variant="outlined" component={Link} to="/courses">
          Back to List
        </Button>
      </Box>
    </Box>
  );
}
