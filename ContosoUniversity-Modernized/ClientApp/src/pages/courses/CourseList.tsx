import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { CourseDto } from '../../types/models';

export default function CourseList() {
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<CourseDto[]>('/courses')
      .then(setCourses)
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mt-4">
      <h1>Courses</h1>
      <Link to="/courses/create" className="btn btn-primary mb-3">Create New</Link>
      <table className="table">
        <thead>
          <tr>
            <th>Course ID</th>
            <th>Title</th>
            <th>Credits</th>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(c => (
            <tr key={c.courseId}>
              <td>{c.courseId}</td>
              <td>{c.title}</td>
              <td>{c.credits}</td>
              <td>{c.departmentName}</td>
              <td>
                <Link to={`/courses/${c.courseId}`} className="btn btn-sm btn-info me-1">Details</Link>
                <Link to={`/courses/${c.courseId}/edit`} className="btn btn-sm btn-warning me-1">Edit</Link>
                <Link to={`/courses/${c.courseId}/delete`} className="btn btn-sm btn-danger">Delete</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
