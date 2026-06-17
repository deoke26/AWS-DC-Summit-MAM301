import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { InstructorDto } from '../../types/models';

export default function DepartmentCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', budget: 0, startDate: '', instructorId: null as number | null });
  const [instructors, setInstructors] = useState<InstructorDto[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<InstructorDto[]>('/instructors')
      .then(setInstructors)
      .catch(err => setError(err.message));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/departments', form);
      navigate('/departments');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mt-4">
      <h1>Create Department</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input type="text" className="form-control" required
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Budget</label>
          <input type="number" className="form-control" required step="0.01"
            value={form.budget} onChange={e => setForm({ ...form, budget: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Start Date</label>
          <input type="date" className="form-control" required
            value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Administrator</label>
          <select className="form-select"
            value={form.instructorId ?? ''}
            onChange={e => setForm({ ...form, instructorId: e.target.value ? parseInt(e.target.value) : null })}>
            <option value="">-- Select --</option>
            {instructors.map(i => (
              <option key={i.id} value={i.id}>{i.lastName}, {i.firstMidName}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary me-2">Create</button>
        <Link to="/departments" className="btn btn-secondary">Back to List</Link>
      </form>
    </div>
  );
}
