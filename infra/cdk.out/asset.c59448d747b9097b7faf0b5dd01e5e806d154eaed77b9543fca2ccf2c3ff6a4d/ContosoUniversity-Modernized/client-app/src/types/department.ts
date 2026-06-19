export interface Department {
  departmentId: number;
  name: string;
  budget: number;
  startDate: string;
  instructorId: number | null;
  administratorName: string | null;
  rowVersion: string; // base64-encoded byte[]
}

export interface ConcurrencyConflict {
  currentValues: Department;
  message: string;
}
