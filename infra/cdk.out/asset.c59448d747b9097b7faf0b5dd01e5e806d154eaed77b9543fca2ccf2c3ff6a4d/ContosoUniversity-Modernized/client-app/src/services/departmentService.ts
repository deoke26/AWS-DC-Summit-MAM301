import { get, post, put, del } from './httpClient';
import type { Department } from '../types/department';

export interface CreateDepartmentRequest {
  name: string;
  budget: number;
  startDate: string;
  instructorId: number | null;
}

export interface UpdateDepartmentRequest extends CreateDepartmentRequest {
  rowVersion: string;
}

export async function getDepartments(): Promise<Department[]> {
  return get<Department[]>('/departments');
}

export async function getDepartment(id: number): Promise<Department> {
  return get<Department>(`/departments/${id}`);
}

export async function createDepartment(data: CreateDepartmentRequest): Promise<Department> {
  return post<Department>('/departments', data);
}

export async function updateDepartment(id: number, data: UpdateDepartmentRequest): Promise<Department> {
  return put<Department>(`/departments/${id}`, data);
}

export async function deleteDepartment(id: number): Promise<void> {
  return del(`/departments/${id}`);
}
