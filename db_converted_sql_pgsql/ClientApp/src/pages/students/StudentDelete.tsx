import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StudentDto } from '../../types/models';

export default function StudentDelete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<StudentDto>(`/students/${id}`)
      .then(setStudent)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    try {
      await api.del(`/students/${id}`);
      navigate('/students');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!student) return <p>Student not found.</p>;

  return (
    <div className="container mt-4">
      <h1>Delete Student</h1>
      <p>Are you sure you want to delete this student?</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <dl className="row">
        <dt className="col-sm-3">Last Name</dt>
        <dd className="col-sm-9">{student.lastName}</dd>
        <dt className="col-sm-3">First Name</dt>
        <dd className="col-sm-9">{student.firstMidName}</dd>
        <dt className="col-sm-3">Enrollment Date</dt>
        <dd className="col-sm-9">{student.enrollmentDate}</dd>
      </dl>
      <button onClick={handleDelete} className="btn btn-danger me-2">Delete</button>
      <Link to="/students" className="btn btn-secondary">Back to List</Link>
    </div>
  );
}
