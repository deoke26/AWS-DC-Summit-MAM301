import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { CourseDetailDto } from '../../types/models';

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<CourseDetailDto>(`/courses/${id}`)
      .then(setCourse)
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!course) return <p>Course not found.</p>;

  return (
    <div className="container mt-4">
      <h1>Course Details</h1>
      <dl className="row">
        <dt className="col-sm-3">Course ID</dt>
        <dd className="col-sm-9">{course.courseId}</dd>
        <dt className="col-sm-3">Title</dt>
        <dd className="col-sm-9">{course.title}</dd>
        <dt className="col-sm-3">Credits</dt>
        <dd className="col-sm-9">{course.credits}</dd>
        <dt className="col-sm-3">Department</dt>
        <dd className="col-sm-9">{course.departmentName}</dd>
      </dl>

      <h2>Instructors</h2>
      {course.instructors.length > 0 ? (
        <ul>
          {course.instructors.map((name, i) => <li key={i}>{name}</li>)}
        </ul>
      ) : (
        <p>No instructors assigned.</p>
      )}

      <Link to={`/courses/${id}/edit`} className="btn btn-warning me-2">Edit</Link>
      <Link to="/courses" className="btn btn-secondary">Back to List</Link>
    </div>
  );
}
