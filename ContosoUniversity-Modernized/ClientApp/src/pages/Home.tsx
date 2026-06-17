import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container mt-4">
      <h1>Welcome to Contoso University</h1>
      <p className="lead">Manage students, courses, instructors, and departments.</p>
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Students</h5>
              <Link to="/students" className="btn btn-primary">View Students</Link>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Courses</h5>
              <Link to="/courses" className="btn btn-primary">View Courses</Link>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Instructors</h5>
              <Link to="/instructors" className="btn btn-primary">View Instructors</Link>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Departments</h5>
              <Link to="/departments" className="btn btn-primary">View Departments</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
