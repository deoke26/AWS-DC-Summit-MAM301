import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { CourseDto, DepartmentDto } from '../../types/models';

export default function CourseEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', credits: 3, departmentId: 0 });
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<CourseDto>(`/courses/${id}`),
      api.get<DepartmentDto[]>('/departments'),
    ])
      .then(([course, deps]) => {
        setForm({ title: course.title, credits: course.credits, departmentId: course.departmentId });
        setDepartments(deps);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/courses/${id}`, form);
      navigate('/courses');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mt-4">
      <h1>Edit Course</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input type="text" className="form-control" required
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Credits</label>
          <input type="number" className="form-control" required min={1} max={5}
            value={form.credits} onChange={e => setForm({ ...form, credits: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Department</label>
          <select className="form-select" value={form.departmentId}
            onChange={e => setForm({ ...form, departmentId: parseInt(e.target.value) })}>
            {departments.map(d => (
              <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary me-2">Save</button>
        <Link to="/courses" className="btn btn-secondary">Back to List</Link>
      </form>
    </div>
  );
}
