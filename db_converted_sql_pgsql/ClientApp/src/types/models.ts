export interface StudentDto {
  id: number;
  lastName: string;
  firstMidName: string;
  enrollmentDate: string;
}

export interface EnrollmentDto {
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  grade: string;
}

export interface StudentDetailDto extends StudentDto {
  enrollments: EnrollmentDto[];
}

export interface CourseDto {
  courseId: number;
  title: string;
  credits: number;
  departmentId: number;
  departmentName: string;
}

export interface CourseDetailDto extends CourseDto {
  instructors: string[];
}

export interface InstructorDto {
  id: number;
  lastName: string;
  firstMidName: string;
  hireDate: string;
  officeLocation: string;
  courses: string[];
}

export interface InstructorDetailDto {
  id: number;
  lastName: string;
  firstMidName: string;
  hireDate: string;
  officeLocation: string;
  courses: CourseDto[];
}

export interface DepartmentDto {
  departmentId: number;
  name: string;
  budget: number;
  startDate: string;
  instructorId: number | null;
  administratorName: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface EnrollmentStatsDto {
  enrollmentDate: string;
  studentCount: number;
}
