import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function StudentCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ lastName: '', firstMidName: '', enrollmentDate: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/students', form);
      navigate('/students');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mt-4">
      <h1>Create Student</h1>
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
          <label className="form-label">Enrollment Date</label>
          <input type="date" className="form-control" required
            value={form.enrollmentDate} onChange={e => setForm({ ...form, enrollmentDate: e.target.value })} />
        </div>
        <button type="submit" className="btn btn-primary me-2">Create</button>
        <Link to="/students" className="btn btn-secondary">Back to List</Link>
      </form>
    </div>
  );
}
