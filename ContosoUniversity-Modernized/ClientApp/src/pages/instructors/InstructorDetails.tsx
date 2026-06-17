import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { InstructorDetailDto } from '../../types/models';

export default function InstructorDetails() {
  const { id } = useParams<{ id: string }>();
  const [instructor, setInstructor] = useState<InstructorDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<InstructorDetailDto>(`/instructors/${id}`)
      .then(setInstructor)
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!instructor) return <p>Instructor not found.</p>;

  return (
    <div className="container mt-4">
      <h1>Instructor Details</h1>
      <dl className="row">
        <dt className="col-sm-3">Last Name</dt>
        <dd className="col-sm-9">{instructor.lastName}</dd>
        <dt className="col-sm-3">First Name</dt>
        <dd className="col-sm-9">{instructor.firstMidName}</dd>
        <dt className="col-sm-3">Hire Date</dt>
        <dd className="col-sm-9">{instructor.hireDate}</dd>
        <dt className="col-sm-3">Office</dt>
        <dd className="col-sm-9">{instructor.officeLocation || 'N/A'}</dd>
      </dl>

      <h2>Assigned Courses</h2>
      {instructor.courses.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Course ID</th>
              <th>Title</th>
              <th>Credits</th>
            </tr>
          </thead>
          <tbody>
            {instructor.courses.map(c => (
              <tr key={c.courseId}>
                <td>{c.courseId}</td>
                <td>{c.title}</td>
                <td>{c.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No courses assigned.</p>
      )}

      <Link to={`/instructors/${id}/edit`} className="btn btn-warning me-2">Edit</Link>
      <Link to="/instructors" className="btn btn-secondary">Back to List</Link>
    </div>
  );
}
