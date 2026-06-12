import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { DepartmentDto } from '../../types/models';

export default function DepartmentDetails() {
  const { id } = useParams<{ id: string }>();
  const [department, setDepartment] = useState<DepartmentDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DepartmentDto>(`/departments/${id}`)
      .then(setDepartment)
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!department) return <p>Department not found.</p>;

  return (
    <div className="container mt-4">
      <h1>Department Details</h1>
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

      <Link to={`/departments/${id}/edit`} className="btn btn-warning me-2">Edit</Link>
      <Link to={`/departments/${id}/delete`} className="btn btn-danger me-2">Delete</Link>
      <Link to="/departments" className="btn btn-secondary">Back to List</Link>
    </div>
  );
}
