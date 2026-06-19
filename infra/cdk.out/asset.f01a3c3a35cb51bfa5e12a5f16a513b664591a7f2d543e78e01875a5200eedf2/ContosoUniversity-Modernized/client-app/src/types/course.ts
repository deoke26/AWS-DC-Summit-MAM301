export interface Course {
  courseId: number;
  title: string;
  credits: number;
  departmentId: number;
  departmentName: string;
  teachingMaterialImagePath: string | null;
}
