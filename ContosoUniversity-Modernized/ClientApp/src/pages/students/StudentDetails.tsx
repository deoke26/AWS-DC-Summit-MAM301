import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StudentDetailDto } from '../../types/models';

export default function StudentDetails() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<StudentDetailDto>(`/students/${id}`)
      .then(setStudent)
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!student) return <p>Student not found.</p>;

  return (
    <div className="container mt-4">
      <h1>Student Details</h1>
      <dl className="row">
        <dt className="col-sm-3">Last Name</dt>
        <dd className="col-sm-9">{student.lastName}</dd>
        <dt className="col-sm-3">First Name</dt>
        <dd className="col-sm-9">{student.firstMidName}</dd>
        <dt className="col-sm-3">Enrollment Date</dt>
        <dd className="col-sm-9">{student.enrollmentDate}</dd>
      </dl>

      <h2>Enrollments</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Course Title</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {student.enrollments.map(e => (
            <tr key={e.enrollmentId}>
              <td>{e.courseTitle}</td>
              <td>{e.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Link to={`/students/${id}/edit`} className="btn btn-warning me-2">Edit</Link>
      <Link to={`/students/${id}/delete`} className="btn btn-danger me-2">Delete</Link>
      <Link to="/students" className="btn btn-secondary">Back to List</Link>
    </div>
  );
}
