import { get, post, put, del } from './httpClient';
import type { Instructor, InstructorDetail, CreateInstructorRequest } from '../types/instructor';

export async function getInstructors(): Promise<Instructor[]> {
  return get<Instructor[]>('/instructors');
}

export async function getInstructor(id: number): Promise<InstructorDetail> {
  return get<InstructorDetail>(`/instructors/${id}`);
}

export async function createInstructor(data: CreateInstructorRequest): Promise<Instructor> {
  return post<Instructor>('/instructors', data);
}

export async function updateInstructor(id: number, data: CreateInstructorRequest): Promise<Instructor> {
  return put<Instructor>(`/instructors/${id}`, data);
}

export async function deleteInstructor(id: number): Promise<void> {
  return del(`/instructors/${id}`);
}
