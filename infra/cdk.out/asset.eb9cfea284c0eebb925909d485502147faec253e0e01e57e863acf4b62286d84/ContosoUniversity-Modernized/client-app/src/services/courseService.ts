import { get, postForm, putForm, del } from './httpClient';
import type { Course } from '../types/course';

export async function getCourses(): Promise<Course[]> {
  return get<Course[]>('/courses');
}

export async function getCourse(id: number): Promise<Course> {
  return get<Course>(`/courses/${id}`);
}

export async function createCourse(formData: FormData): Promise<Course> {
  return postForm<Course>('/courses', formData);
}

export async function updateCourse(id: number, formData: FormData): Promise<Course> {
  return putForm<Course>(`/courses/${id}`, formData);
}

export async function deleteCourse(id: number): Promise<void> {
  return del(`/courses/${id}`);
}
