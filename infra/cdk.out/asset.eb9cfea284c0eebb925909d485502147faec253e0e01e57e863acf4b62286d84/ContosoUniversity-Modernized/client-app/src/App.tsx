import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorNotification from './components/ErrorNotification';
import NotFoundPage from './components/NotFoundPage';
import StudentList from './pages/students/StudentList';
import StudentCreate from './pages/students/StudentCreate';
import StudentEdit from './pages/students/StudentEdit';
import StudentDetails from './pages/students/StudentDetails';
import CourseList from './pages/courses/CourseList';
import CourseCreate from './pages/courses/CourseCreate';
import CourseEdit from './pages/courses/CourseEdit';
import CourseDetails from './pages/courses/CourseDetails';
import DepartmentList from './pages/departments/DepartmentList';
import DepartmentCreate from './pages/departments/DepartmentCreate';
import DepartmentEdit from './pages/departments/DepartmentEdit';
import DepartmentDetails from './pages/departments/DepartmentDetails';
import InstructorList from './pages/instructors/InstructorList';
import InstructorCreate from './pages/instructors/InstructorCreate';
import InstructorEdit from './pages/instructors/InstructorEdit';
import InstructorDetails from './pages/instructors/InstructorDetails';
import NotificationDashboard from './pages/notifications/NotificationDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorNotification />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/students" replace />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/create" element={<StudentCreate />} />
          <Route path="/students/:id/edit" element={<StudentEdit />} />
          <Route path="/students/:id" element={<StudentDetails />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/create" element={<CourseCreate />} />
          <Route path="/courses/:id/edit" element={<CourseEdit />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/departments" element={<DepartmentList />} />
          <Route path="/departments/create" element={<DepartmentCreate />} />
          <Route path="/departments/:id/edit" element={<DepartmentEdit />} />
          <Route path="/departments/:id" element={<DepartmentDetails />} />
          <Route path="/instructors" element={<InstructorList />} />
          <Route path="/instructors/create" element={<InstructorCreate />} />
          <Route path="/instructors/:id/edit" element={<InstructorEdit />} />
          <Route path="/instructors/:id" element={<InstructorDetails />} />
          <Route path="/notifications" element={<NotificationDashboard />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
