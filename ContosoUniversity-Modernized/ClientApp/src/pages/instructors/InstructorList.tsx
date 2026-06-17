import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { InstructorDto } from '../../types/models';

export default function InstructorList() {
  const [instructors, setInstructors] = useState<InstructorDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<InstructorDto[]>('/instructors')
      .then(setInstructors)
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mt-4">
      <h1>Instructors</h1>
      <Link to="/instructors/create" className="btn btn-primary mb-3">Create New</Link>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Hire Date</th>
            <th>Office</th>
            <th>Courses</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {instructors.map(i => (
            <tr key={i.id}>
              <td>{i.lastName}, {i.firstMidName}</td>
              <td>{i.hireDate}</td>
              <td>{i.officeLocation}</td>
              <td>{i.courses.join(', ')}</td>
              <td>
                <Link to={`/instructors/${i.id}`} className="btn btn-sm btn-info me-1">Details</Link>
                <Link to={`/instructors/${i.id}/edit`} className="btn btn-sm btn-warning me-1">Edit</Link>
                <Link to={`/instructors/${i.id}/delete`} className="btn btn-sm btn-danger">Delete</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
