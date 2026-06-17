import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StudentDto, PaginatedResult } from '../../types/models';
import Pagination from '../../components/Pagination';

export default function StudentList() {
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('');
  const [searchString, setSearchString] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (searchString) params.append('searchString', searchString);
    params.append('page', page.toString());

    api.get<PaginatedResult<StudentDto>>(`/students?${params.toString()}`)
      .then(result => {
        setStudents(result.items);
        setTotalCount(result.totalCount);
      })
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }, [sortOrder, searchString, page]);

  const handleSort = (field: string) => {
    if (sortOrder === field) {
      setSortOrder(`${field}_desc`);
    } else {
      setSortOrder(field);
    }
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="container mt-4">
      <h1>Students</h1>
      <div className="d-flex justify-content-between mb-3">
        <Link to="/students/create" className="btn btn-primary">Create New</Link>
        <form onSubmit={handleSearch} className="d-flex">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Search by name..."
            value={searchString}
            onChange={e => setSearchString(e.target.value)}
          />
          <button type="submit" className="btn btn-outline-secondary">Search</button>
        </form>
      </div>

      {loading ? <p>Loading...</p> : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>
                  <button className="btn btn-link p-0" onClick={() => handleSort('lastName')}>
                    Last Name
                  </button>
                </th>
                <th>
                  <button className="btn btn-link p-0" onClick={() => handleSort('firstName')}>
                    First Name
                  </button>
                </th>
                <th>
                  <button className="btn btn-link p-0" onClick={() => handleSort('enrollmentDate')}>
                    Enrollment Date
                  </button>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>{s.lastName}</td>
                  <td>{s.firstMidName}</td>
                  <td>{s.enrollmentDate}</td>
                  <td>
                    <Link to={`/students/${s.id}`} className="btn btn-sm btn-info me-1">Details</Link>
                    <Link to={`/students/${s.id}/edit`} className="btn btn-sm btn-warning me-1">Edit</Link>
                    <Link to={`/students/${s.id}/delete`} className="btn btn-sm btn-danger">Delete</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
