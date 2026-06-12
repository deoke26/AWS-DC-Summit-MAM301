import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { DepartmentDto } from '../../types/models';

export default function DepartmentDelete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<DepartmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<DepartmentDto>(`/departments/${id}`)
      .then(setDepartment)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    try {
      await api.del(`/departments/${id}`);
      navigate('/departments');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!department) return <p>Department not found.</p>;

  return (
    <div className="container mt-4">
      <h1>Delete Department</h1>
      <p>Are you sure you want to delete this department?</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <dl className="row">
        <dt className="col-sm-3">Name</dt>
        <dd className="col-sm-9">{department.name}</dd>
        <dt className="col-sm-3">Budget</dt>
        <dd className="col-sm-9">${department.budget.toLocaleString()}</dd>
        <dt className="col-sm-3">Start Date</dt>
        <dd className="col-sm-9">{department.startDate}</dd>
        <dt className="col-sm-3">Administrator</dt>
        <dd className="col-sm-9">{department.administratorName || 'N/A'}</dd>
      </dl>
      <button onClick={handleDelete} className="btn btn-danger me-2">Delete</button>
      <Link to="/departments" className="btn btn-secondary">Back to List</Link>
    </div>
  );
}
