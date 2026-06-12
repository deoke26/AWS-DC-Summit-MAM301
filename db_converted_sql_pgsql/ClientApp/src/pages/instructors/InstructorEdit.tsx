import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { InstructorDetailDto, CourseDto } from '../../types/models';

export default function InstructorEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    lastName: '',
    firstMidName: '',
    hireDate: '',
    officeLocation: '',
    courseIds: [] as number[],
  });
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<InstructorDetailDto>(`/instructors/${id}`),
      api.get<CourseDto[]>('/courses'),
    ])
      .then(([instructor, allCourses]) => {
        setForm({
          lastName: instructor.lastName,
          firstMidName: instructor.firstMidName,
          hireDate: instructor.hireDate,
          officeLocation: instructor.officeLocation || '',
          courseIds: instructor.courses.map(c => c.courseId),
        });
        setCourses(allCourses);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleCourse = (courseId: number) => {
    setForm(f => ({
      ...f,
      courseIds: f.courseIds.includes(courseId)
        ? f.courseIds.filter(cid => cid !== courseId)
        : [...f.courseIds, courseId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/instructors/${id}`, form);
      navigate('/instructors');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mt-4">
      <h1>Edit Instructor</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Last Name</label>
          <input type="text" className="form-control" required
            value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">First Name</label>
          <input type="text" className="form-control" required
            value={form.firstMidName} onChange={e => setForm({ ...form, firstMidName: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Hire Date</label>
          <input type="date" className="form-control" required
            value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Office Location</label>
          <input type="text" className="form-control"
            value={form.officeLocation} onChange={e => setForm({ ...form, officeLocation: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Courses</label>
          <div>
            {courses.map(c => (
              <div key={c.courseId} className="form-check">
                <input type="checkbox" className="form-check-input"
                  id={`course-${c.courseId}`}
                  checked={form.courseIds.includes(c.courseId)}
                  onChange={() => toggleCourse(c.courseId)} />
                <label className="form-check-label" htmlFor={`course-${c.courseId}`}>
                  {c.courseId} - {c.title}
                </label>
              </div>
            ))}
          </div>
        </div>
        <button type="submit" className="btn btn-primary me-2">Save</button>
        <Link to="/instructors" className="btn btn-secondary">Back to List</Link>
      </form>
    </div>
  );
}
