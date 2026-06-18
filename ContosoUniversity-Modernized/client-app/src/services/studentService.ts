import { get, post, put, del } from './httpClient';
import type { Student, StudentDetail, CreateStudentRequest } from '../types/student';
import type { PaginatedResponse } from '../types/common';

export async function getStudents(
  page: number,
  pageSize: number,
  sortOrder: string,
  searchString: string
): Promise<PaginatedResponse<Student>> {
  return get<PaginatedResponse<Student>>('/students', {
    page,
    pageSize,
    sortOrder,
    searchString,
  });
}

export async function getStudent(id: number): Promise<StudentDetail> {
  return get<StudentDetail>(`/students/${id}`);
}

export async function createStudent(data: CreateStudentRequest): Promise<Student> {
  return post<Student>('/students', data);
}

export async function updateStudent(id: number, data: CreateStudentRequest): Promise<Student> {
  return put<Student>(`/students/${id}`, data);
}

export async function deleteStudent(id: number): Promise<void> {
  return del(`/students/${id}`);
}
