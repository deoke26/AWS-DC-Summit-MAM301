import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StudentDto } from '../../types/models';

export default function StudentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({ lastName: '', firstMidName: '', enrollmentDate: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<StudentDto>(`/students/${id}`)
      .then(s => setForm({ lastName: s.lastName, firstMidName: s.firstMidName, enrollmentDate: s.enrollmentDate }))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/students/${id}`, form);
      navigate('/students');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mt-4">
      <h1>Edit Student</h1>
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
        <button type="submit" className="btn btn-primary me-2">Save</button>
        <Link to="/students" className="btn btn-secondary">Back to List</Link>
      </form>
    </div>
  );
}
