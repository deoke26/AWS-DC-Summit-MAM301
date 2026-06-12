import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { CourseDto } from '../../types/models';

export default function CourseDelete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<CourseDto>(`/courses/${id}`)
      .then(setCourse)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    try {
      await api.del(`/courses/${id}`);
      navigate('/courses');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!course) return <p>Course not found.</p>;

  return (
    <div className="container mt-4">
      <h1>Delete Course</h1>
      <p>Are you sure you want to delete this course?</p>
      {error && <div className="alert alert-danger">{error}</div>}
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
      <button onClick={handleDelete} className="btn btn-danger me-2">Delete</button>
      <Link to="/courses" className="btn btn-secondary">Back to List</Link>
    </div>
  );
}
