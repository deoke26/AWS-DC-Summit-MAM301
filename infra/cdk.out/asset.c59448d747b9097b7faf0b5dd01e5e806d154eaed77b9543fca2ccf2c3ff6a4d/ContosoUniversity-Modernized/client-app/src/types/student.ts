export interface Student {
  id: number;
  lastName: string;
  firstMidName: string;
  enrollmentDate: string; // ISO 8601
}

export interface StudentDetail extends Student {
  enrollments: Enrollment[];
}

export interface Enrollment {
  courseName: string;
  grade: string | null;
}

export interface CreateStudentRequest {
  lastName: string;
  firstMidName: string;
  enrollmentDate: string;
}
