import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { InstructorDto } from '../../types/models';

export default function InstructorDelete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState<InstructorDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<InstructorDto>(`/instructors/${id}`)
      .then(setInstructor)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    try {
      await api.del(`/instructors/${id}`);
      navigate('/instructors');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!instructor) return <p>Instructor not found.</p>;

  return (
    <div className="container mt-4">
      <h1>Delete Instructor</h1>
      <p>Are you sure you want to delete this instructor?</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <dl className="row">
        <dt className="col-sm-3">Name</dt>
        <dd className="col-sm-9">{instructor.lastName}, {instructor.firstMidName}</dd>
        <dt className="col-sm-3">Hire Date</dt>
        <dd className="col-sm-9">{instructor.hireDate}</dd>
        <dt className="col-sm-3">Office</dt>
        <dd className="col-sm-9">{instructor.officeLocation || 'N/A'}</dd>
      </dl>
      <button onClick={handleDelete} className="btn btn-danger me-2">Delete</button>
      <Link to="/instructors" className="btn btn-secondary">Back to List</Link>
    </div>
  );
}
