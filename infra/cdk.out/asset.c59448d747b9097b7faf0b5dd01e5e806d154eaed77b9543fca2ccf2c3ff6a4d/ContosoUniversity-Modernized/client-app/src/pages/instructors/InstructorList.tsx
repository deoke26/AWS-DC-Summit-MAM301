import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import LoadingIndicator from '../../components/LoadingIndicator';
import ConfirmDialog from '../../components/ConfirmDialog';
import { getInstructors, getInstructor, deleteInstructor } from '../../services/instructorService';
import type { Instructor, InstructorDetail, CourseWithEnrollments } from '../../types/instructor';
import type { Enrollment } from '../../types/student';

export default function InstructorList() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null);
  const [instructorDetail, setInstructorDetail] = useState<InstructorDetail | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedCourseEnrollments, setSelectedCourseEnrollments] = useState<Enrollment[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null);

  useEffect(() => {
    loadInstructors();
  }, []);

  async function loadInstructors() {
    setLoading(true);
    try {
      const data = await getInstructors();
      setInstructors(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleInstructorRowClick(instructor: Instructor) {
    if (selectedInstructorId === instructor.id) {
      return;
    }
    setSelectedInstructorId(instructor.id);
    setSelectedCourseId(null);
    setSelectedCourseEnrollments([]);
    try {
      const detail = await getInstructor(instructor.id);
      setInstructorDetail(detail);
    } catch {
      setInstructorDetail(null);
    }
  }

  function handleCourseRowClick(course: CourseWithEnrollments) {
    if (selectedCourseId === course.courseId) {
      return;
    }
    setSelectedCourseId(course.courseId);
    setSelectedCourseEnrollments(course.enrollments);
  }

  function handleDeleteClick(instructor: Instructor) {
    setInstructorToDelete(instructor);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!instructorToDelete) return;
    try {
      await deleteInstructor(instructorToDelete.id);
      setInstructors((prev) => prev.filter((i) => i.id !== instructorToDelete.id));
      if (selectedInstructorId === instructorToDelete.id) {
        setSelectedInstructorId(null);
        setInstructorDetail(null);
        setSelectedCourseId(null);
        setSelectedCourseEnrollments([]);
      }
    } finally {
      setDeleteDialogOpen(false);
      setInstructorToDelete(null);
    }
  }

  function handleDeleteCancel() {
    setDeleteDialogOpen(false);
    setInstructorToDelete(null);
  }

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Instructors
        </Typography>
        <Button variant="contained" component={RouterLink} to="/instructors/create">
          Create New
        </Button>
      </Box>

      {/* Instructors Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Last Name</TableCell>
              <TableCell>First Name</TableCell>
              <TableCell>Hire Date</TableCell>
              <TableCell>Office</TableCell>
              <TableCell>Assigned Courses</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {instructors.map((instructor) => (
              <TableRow
                key={instructor.id}
                hover
                selected={selectedInstructorId === instructor.id}
                onClick={() => handleInstructorRowClick(instructor)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{instructor.lastName}</TableCell>
                <TableCell>{instructor.firstMidName}</TableCell>
                <TableCell>{new Date(instructor.hireDate).toLocaleDateString()}</TableCell>
                <TableCell>{instructor.officeLocation ?? ''}</TableCell>
                <TableCell>
                  {instructor.assignedCourseIds.length > 0
                    ? instructor.assignedCourseIds.join(', ')
                    : ''}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="small"
                    component={RouterLink}
                    to={`/instructors/${instructor.id}/edit`}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    component={RouterLink}
                    to={`/instructors/${instructor.id}`}
                  >
                    Details
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(instructor)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Courses Table (shown when an instructor is selected) */}
      {selectedInstructorId && instructorDetail && instructorDetail.courses.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            Courses Assigned to {instructorDetail.lastName}, {instructorDetail.firstMidName}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Course Number</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Department</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instructorDetail.courses.map((course) => (
                  <TableRow
                    key={course.courseId}
                    hover
                    selected={selectedCourseId === course.courseId}
                    onClick={() => handleCourseRowClick(course)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{course.courseId}</TableCell>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>{course.departmentName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Enrollments Table (shown when a course is selected) */}
      {selectedCourseId && selectedCourseEnrollments.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            Students Enrolled
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Grade</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedCourseEnrollments.map((enrollment, index) => (
                  <TableRow key={index}>
                    <TableCell>{enrollment.courseName}</TableCell>
                    <TableCell>{enrollment.grade ?? 'No grade'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Instructor"
        message={
          instructorToDelete
            ? `Are you sure you want to delete ${instructorToDelete.lastName}, ${instructorToDelete.firstMidName}?`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Box>
  );
}
