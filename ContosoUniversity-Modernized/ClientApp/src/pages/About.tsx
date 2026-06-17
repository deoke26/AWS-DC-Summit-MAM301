import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { EnrollmentStatsDto } from '../types/models';

export default function About() {
  const [stats, setStats] = useState<EnrollmentStatsDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<EnrollmentStatsDto[]>('/stats/enrollments')
      .then(setStats)
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container mt-4">
      <h1>Student Body Statistics</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Enrollment Date</th>
            <th>Student Count</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s, i) => (
            <tr key={i}>
              <td>{s.enrollmentDate}</td>
              <td>{s.studentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
