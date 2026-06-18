import type { Enrollment } from './student';

export interface Instructor {
  id: number;
  lastName: string;
  firstMidName: string;
  hireDate: string;
  officeLocation: string | null;
  assignedCourseIds: number[];
}

export interface InstructorDetail extends Instructor {
  courses: CourseWithEnrollments[];
}

export interface CourseWithEnrollments {
  courseId: number;
  title: string;
  departmentName: string;
  enrollments: Enrollment[];
}

export interface CreateInstructorRequest {
  lastName: string;
  firstMidName: string;
  hireDate: string;
  officeLocation: string | null;
  courseIds: number[];
}
