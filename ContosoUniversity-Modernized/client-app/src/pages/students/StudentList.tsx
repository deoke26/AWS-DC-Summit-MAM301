import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  TableSortLabel,
} from '@mui/material';
import { getStudents, deleteStudent } from '../../services/studentService';
import type { Student } from '../../types/student';
import type { PaginatedResponse } from '../../types/common';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingIndicator from '../../components/LoadingIndicator';

type SortColumn = 'name' | 'date';
type SortDirection = 'asc' | 'desc';

function buildSortOrder(column: SortColumn, direction: SortDirection): string {
  return `${column}_${direction}`;
}

export default function StudentList() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchString, setSearchString] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const sortOrder = buildSortOrder(sortColumn, sortDirection);
      const response: PaginatedResponse<Student> = await getStudents(
        page,
        10,
        sortOrder,
        searchString
      );
      setStudents(response.items);
      setTotalPages(response.totalPages);
      setHasPreviousPage(response.hasPreviousPage);
      setHasNextPage(response.hasNextPage);
    } finally {
      setLoading(false);
    }
  }, [page, sortColumn, sortDirection, searchString]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value);
    setPage(1);
  };

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handlePrevious = () => {
    if (hasPreviousPage) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  const handleDeleteClick = (student: Student) => {
    setDeleteTarget(student);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteStudent(deleteTarget.id);
    setDeleteTarget(null);
    fetchStudents();
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  if (loading && students.length === 0) {
    return <LoadingIndicator />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Students</Typography>
        <Button variant="contained" component={Link} to="/students/create">
          Create New
        </Button>
      </Box>

      <TextField
        label="Search"
        variant="outlined"
        size="small"
        value={searchString}
        onChange={handleSearchChange}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortColumn === 'name'}
                  direction={sortColumn === 'name' ? sortDirection : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Last Name
                </TableSortLabel>
              </TableCell>
              <TableCell>First Name</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortColumn === 'date'}
                  direction={sortColumn === 'date' ? sortDirection : 'asc'}
                  onClick={() => handleSort('date')}
                >
                  Enrollment Date
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.lastName}</TableCell>
                <TableCell>{student.firstMidName}</TableCell>
                <TableCell>{new Date(student.enrollmentDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    component={Link}
                    to={`/students/${student.id}`}
                  >
                    Details
                  </Button>
                  <Button
                    size="small"
                    onClick={() => navigate(`/students/${student.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(student)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
        <Button
          variant="outlined"
          disabled={!hasPreviousPage}
          onClick={handlePrevious}
        >
          Previous
        </Button>
        <Typography>
          Page {page} of {totalPages}
        </Typography>
        <Button
          variant="outlined"
          disabled={!hasNextPage}
          onClick={handleNext}
        >
          Next
        </Button>
      </Box>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Student"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.firstMidName} ${deleteTarget.lastName}?`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Box>
  );
}
