import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { DepartmentDto } from '../../types/models';

export default function DepartmentList() {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DepartmentDto[]>('/departments')
      .then(setDepartments)
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mt-4">
      <h1>Departments</h1>
      <Link to="/departments/create" className="btn btn-primary mb-3">Create New</Link>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Budget</th>
            <th>Start Date</th>
            <th>Administrator</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map(d => (
            <tr key={d.departmentId}>
              <td>{d.name}</td>
              <td>${d.budget.toLocaleString()}</td>
              <td>{d.startDate}</td>
              <td>{d.administratorName}</td>
              <td>
                <Link to={`/departments/${d.departmentId}`} className="btn btn-sm btn-info me-1">Details</Link>
                <Link to={`/departments/${d.departmentId}/edit`} className="btn btn-sm btn-warning me-1">Edit</Link>
                <Link to={`/departments/${d.departmentId}/delete`} className="btn btn-sm btn-danger">Delete</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
