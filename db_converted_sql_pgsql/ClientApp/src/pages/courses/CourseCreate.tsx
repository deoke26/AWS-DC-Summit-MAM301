import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { DepartmentDto } from '../../types/models';

export default function CourseCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ courseId: 0, title: '', credits: 3, departmentId: 0 });
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<DepartmentDto[]>('/departments')
      .then(deps => {
        setDepartments(deps);
        if (deps.length > 0) setForm(f => ({ ...f, departmentId: deps[0].departmentId }));
      })
      .catch(err => setError(err.message));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/courses', form);
      navigate('/courses');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mt-4">
      <h1>Create Course</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Course ID</label>
          <input type="number" className="form-control" required
            value={form.courseId} onChange={e => setForm({ ...form, courseId: parseInt(e.target.value) || 0 })} />
        </div>
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
        <button type="submit" className="btn btn-primary me-2">Create</button>
        <Link to="/courses" className="btn btn-secondary">Back to List</Link>
      </form>
    </div>
  );
}
