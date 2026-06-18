# Implementation Plan: React Frontend Refactor

## Overview

This plan implements the refactoring of Contoso University from server-rendered MVC Razor Views to a decoupled architecture: ASP.NET Core REST API controllers (C#) + a React SPA (Vite + TypeScript + Material UI). Tasks are ordered to build foundational layers first (cleanup, project scaffolding, types, API controllers) before layering on the service client, shared components, and feature pages.

## Tasks

- [x] 1. Delete existing ClientApp folder and scaffold React app
  - [x] 1.1 Delete the ContosoUniversity-Modernized/ClientApp/ directory and remove any references to it in .csproj or configuration files
    - Recursively delete the ClientApp/ folder
    - Remove any SPA-related entries or paths referencing ClientApp in the .csproj
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 1.2 Initialize the Vite + React + TypeScript project at ContosoUniversity-Modernized/client-app/
    - Run Vite scaffolding with the React TypeScript template
    - Install dependencies: react, react-dom, react-router-dom, axios
    - Install MUI dependencies: @mui/material, @mui/icons-material, @emotion/react, @emotion/styled
    - Install dev dependencies: @types/react, @types/react-dom, typescript
    - Configure vite.config.ts with dev server on port 5173 and proxy /api to http://localhost:5050
    - Create src/pages/, src/components/, src/services/, src/types/ directories
    - Verify `npm run build` succeeds with zero exit code
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7_

- [x] 2. Create shared TypeScript types and API DTOs
  - [x] 2.1 Create client-side TypeScript type definitions
    - Create src/types/common.ts with PaginatedResponse<T>, ValidationError, ApiError interfaces
    - Create src/types/student.ts with Student, StudentDetail, Enrollment, CreateStudentRequest interfaces
    - Create src/types/course.ts with Course interface
    - Create src/types/department.ts with Department, ConcurrencyConflict interfaces
    - Create src/types/instructor.ts with Instructor, InstructorDetail, CourseWithEnrollments interfaces
    - Create src/types/notification.ts with Notification interface
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 5.1_

  - [x] 2.2 Create server-side C# DTO classes in a Models/Dtos/ folder
    - Create PaginatedResponse<T> class
    - Create StudentDto, StudentDetailDto, EnrollmentDto, CreateStudentRequest, UpdateStudentRequest
    - Create CourseDto with TeachingMaterialImagePath
    - Create DepartmentDto with RowVersion, CreateDepartmentRequest, UpdateDepartmentRequest
    - Create InstructorDto, InstructorDetailDto, CourseWithEnrollmentsDto, CreateInstructorRequest
    - Create NotificationDto
    - Apply [Required], [StringLength], [Range] data annotations as specified in the design
    - _Requirements: 1.5, 1.6, 2.4, 2.5, 3.4, 3.5, 4.4, 4.5, 5.1_

- [x] 3. Implement Students API Controller
  - [x] 3.1 Create Controllers/Api/StudentsApiController.cs
    - Implement GET /api/students with page, pageSize (1-50, default 10), sortOrder (name_asc/name_desc/date_asc/date_desc), searchString query params
    - Implement server-side pagination using existing PaginatedList helper, map to PaginatedResponse<StudentDto>
    - Implement GET /api/students/{id} returning StudentDetailDto with enrollments
    - Implement POST /api/students with model validation, return 201 with created StudentDto
    - Implement PUT /api/students/{id} with model validation, return 200 with updated StudentDto
    - Implement DELETE /api/students/{id} returning 204
    - Return 404 for non-existent student IDs on GET, PUT, DELETE
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [ ]* 3.2 Write property tests for Student API validation and pagination
    - **Property 1: Pagination math is correct** — for any totalCount and pageSize 1-50, verify totalPages = ceil(totalCount/pageSize), hasPreviousPage/hasNextPage flags
    - **Property 2: Valid student data round-trips** — for any valid student data, POST then GET returns matching fields
    - **Property 3: Invalid student data is rejected** — for any invalid student data, POST returns 400 with field-level errors
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 1.6**

- [x] 4. Implement Courses API Controller
  - [x] 4.1 Create Controllers/Api/CoursesApiController.cs
    - Implement GET /api/courses returning CourseDto[] with department names
    - Implement GET /api/courses/{id} returning CourseDto with detail
    - Implement POST /api/courses accepting multipart/form-data with file validation (extensions: jpg/jpeg/png/gif/bmp, max 5 MB)
    - Save uploaded files with unique filenames to Uploads/TeachingMaterials/
    - Implement PUT /api/courses/{id} with file replacement logic (delete old file, save new)
    - Implement DELETE /api/courses/{id} that removes the course and its associated file from disk
    - Return 404 for non-existent course IDs on GET, PUT, DELETE
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

  - [ ]* 4.2 Write property tests for Course API validation
    - **Property 4: Invalid course data or file is rejected** — for any invalid title/credits/departmentId or disallowed file extension or file > 5MB, verify 400 with validation errors
    - **Validates: Requirements 2.5, 2.6, 2.7**

- [x] 5. Implement Departments API Controller
  - [x] 5.1 Create Controllers/Api/DepartmentsApiController.cs
    - Implement GET /api/departments returning DepartmentDto[] with administrator names
    - Implement GET /api/departments/{id} returning DepartmentDto with RowVersion
    - Implement POST /api/departments with validation (Name 3-50 chars, Budget 0-999999999.99, required StartDate, optional valid InstructorID)
    - Implement PUT /api/departments/{id} with RowVersion concurrency check
    - On DbUpdateConcurrencyException, return 409 with current database values
    - Implement DELETE /api/departments/{id} returning 204
    - Return 404 for non-existent department IDs
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [ ]* 5.2 Write property tests for Department concurrency and validation
    - **Property 5: Invalid department data is rejected** — for any invalid name/budget/startDate/instructorId, verify 400
    - **Property 6: Optimistic concurrency — matching RowVersion succeeds** — update with current RowVersion returns 200 and new RowVersion
    - **Property 7: Optimistic concurrency — stale RowVersion produces conflict** — update with stale RowVersion returns 409 with current values
    - **Validates: Requirements 3.5, 3.6, 3.8**

- [x] 6. Implement Instructors API Controller
  - [x] 6.1 Create Controllers/Api/InstructorsApiController.cs
    - Implement GET /api/instructors returning InstructorDto[] with office locations and assigned course IDs, ordered by last name
    - Implement GET /api/instructors/{id} returning InstructorDetailDto with courses and enrollments
    - Implement POST /api/instructors with course assignment creation
    - Implement PUT /api/instructors/{id} with course assignment synchronization (add new, remove omitted)
    - Implement DELETE /api/instructors/{id} with cascade: remove office assignment, null-out department administrator references
    - Return 404 for non-existent instructor IDs
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [ ]* 6.2 Write property tests for Instructor course assignment synchronization
    - **Property 8: Instructor course assignment synchronization** — for any instructor and subset of course IDs in PUT, after update the assigned courses exactly equal the provided set
    - **Validates: Requirements 4.6**

- [x] 7. Implement Notifications API Controller
  - [x] 7.1 Create Controllers/Api/NotificationsApiController.cs
    - Implement GET /api/notifications returning max 10 unread notifications ordered by createdAt descending
    - Implement POST /api/notifications/{id}/mark-read setting isRead=true and readAt=now
    - Return 404 for non-existent notification IDs on mark-read
    - Return 400 for invalid (non-positive-integer) IDs
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.2 Write property tests for Notification query and mark-read
    - **Property 9: Notification query returns only unread, ordered, capped** — GET returns only isRead=false, ordered createdAt desc, max 10 items
    - **Property 10: Notification mark-read state transition** — after mark-read, notification no longer appears in GET results
    - **Validates: Requirements 5.1, 5.2**

- [x] 8. Checkpoint - Ensure all API controllers compile and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create centralized HTTP client and service layer
  - [x] 9.1 Implement src/services/httpClient.ts
    - Configure axios instance with baseURL "/api" and 30-second timeout
    - Add response interceptor: 404 → navigate to /not-found, 409 → typed ConcurrencyConflict rejection, 400 → typed ValidationError rejection, 500/network → Snackbar error with 8s auto-dismiss
    - Export typed methods: get<T>, post<T>, put<T>, del, postForm<T>, putForm<T>
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 9.2 Implement src/services/studentService.ts
    - getStudents(page, pageSize, sortOrder, searchString) → PaginatedResponse<Student>
    - getStudent(id) → StudentDetail
    - createStudent(data) → Student
    - updateStudent(id, data) → Student
    - deleteStudent(id) → void
    - _Requirements: 1.1, 1.3, 1.5, 1.7, 1.9_

  - [x] 9.3 Implement src/services/courseService.ts
    - getCourses() → Course[]
    - getCourse(id) → Course
    - createCourse(formData) → Course (multipart/form-data)
    - updateCourse(id, formData) → Course (multipart/form-data)
    - deleteCourse(id) → void
    - _Requirements: 2.1, 2.2, 2.4, 2.8, 2.10_

  - [x] 9.4 Implement src/services/departmentService.ts
    - getDepartments() → Department[]
    - getDepartment(id) → Department
    - createDepartment(data) → Department
    - updateDepartment(id, data) → Department (includes RowVersion)
    - deleteDepartment(id) → void
    - _Requirements: 3.1, 3.2, 3.4, 3.6, 3.9_

  - [x] 9.5 Implement src/services/instructorService.ts
    - getInstructors() → Instructor[]
    - getInstructor(id) → InstructorDetail
    - createInstructor(data) → Instructor
    - updateInstructor(id, data) → Instructor
    - deleteInstructor(id) → void
    - _Requirements: 4.1, 4.2, 4.4, 4.6, 4.9_

  - [x] 9.6 Implement src/services/notificationService.ts
    - getNotifications() → Notification[]
    - markAsRead(id) → void
    - _Requirements: 5.1, 5.2_

  - [ ]* 9.7 Write property tests for HTTP client interceptor behavior
    - **Property 15: HTTP 404 interceptor navigates to Not Found page** — for any API call returning 404, verify navigation triggered
    - **Property 16: HTTP 500 and network errors show auto-dismissing toast** — for any 500/network error, verify error notification with 8s dismiss
    - **Validates: Requirements 12.2, 12.5**

- [x] 10. Build shared React components
  - [x] 10.1 Create src/components/Layout.tsx and src/components/NavBar.tsx
    - Layout wraps all routes with AppBar and main content area
    - NavBar includes links: Students, Courses, Departments, Instructors, Notifications
    - Use MUI AppBar, Toolbar, Button components
    - _Requirements: 6.5, 6.6_

  - [x] 10.2 Create src/components/ConfirmDialog.tsx
    - Accept props: open, title, message, onConfirm, onCancel
    - Use MUI Dialog component
    - _Requirements: 7.8, 8.5, 9.6, 10.8_

  - [x] 10.3 Create src/components/LoadingIndicator.tsx and src/components/ErrorNotification.tsx
    - LoadingIndicator uses MUI CircularProgress, displayed during API requests
    - ErrorNotification uses MUI Snackbar with 8-second auto-dismiss for 500/network errors
    - _Requirements: 12.5, 12.6_

  - [x] 10.4 Create src/components/NotFoundPage.tsx
    - Display user-friendly message that the requested resource does not exist
    - Include navigation link back to home
    - _Requirements: 12.2_

  - [x] 10.5 Create src/App.tsx with routing configuration
    - Define all routes per the design: students, courses, departments, instructors, notifications, catch-all
    - Root path (/) redirects to /students
    - Wrap routes in Layout component
    - _Requirements: 6.5, 6.6_

- [x] 11. Implement Students React pages
  - [x] 11.1 Create src/pages/students/StudentList.tsx
    - Render paginated MUI Table with Last Name, First Name, Enrollment Date columns
    - Implement search field that filters and resets to page 1
    - Implement sortable column headers (Last Name, Enrollment Date) toggling asc/desc
    - Implement Next/Previous pagination controls with disable logic
    - Include Create, Edit, Delete, Details action buttons/links
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 11.2 Create src/pages/students/StudentCreate.tsx and StudentEdit.tsx
    - Form with Last Name, First Name, Enrollment Date fields
    - Display inline validation errors from API responses
    - On success, navigate to student list
    - StudentEdit pre-populates form with existing data
    - _Requirements: 7.5, 7.6, 7.7_

  - [x] 11.3 Create src/pages/students/StudentDetails.tsx
    - Display student info and enrollments list (course title + grade)
    - _Requirements: 7.9_

  - [ ]* 11.4 Write property tests for student list sort toggle and pagination controls
    - **Property 11: Sort toggle state machine** — clicking same column toggles direction, clicking different column sets asc
    - **Property 12: Pagination control disable invariants** — Previous disabled on page 1, Next disabled on last page
    - **Validates: Requirements 7.3, 7.4**

- [x] 12. Implement Courses React pages
  - [x] 12.1 Create src/pages/courses/CourseList.tsx
    - Render MUI Table with Course Number, Title, Credits, Department columns
    - Include Create, Edit, Delete, Details action buttons/links
    - _Requirements: 8.1_

  - [x] 12.2 Create src/pages/courses/CourseCreate.tsx and CourseEdit.tsx
    - Form with Course Number, Title, Credits, Department dropdown, file upload input
    - Build FormData for multipart submission
    - Display inline validation errors (including file type/size errors)
    - On success, navigate to course list
    - _Requirements: 8.2, 8.3, 8.4_

  - [x] 12.3 Create src/pages/courses/CourseDetails.tsx
    - Display course info and render teaching material image if path exists
    - _Requirements: 8.6_

- [x] 13. Implement Departments React pages
  - [x] 13.1 Create src/pages/departments/DepartmentList.tsx
    - Render MUI Table with Name, Budget (currency formatted), Start Date, Administrator columns
    - Include Create, Edit, Delete, Details action buttons/links
    - _Requirements: 9.1_

  - [x] 13.2 Create src/pages/departments/DepartmentCreate.tsx and DepartmentEdit.tsx
    - Form with Name, Budget, Start Date, Administrator dropdown
    - DepartmentEdit includes RowVersion in PUT request
    - On 409 response, display side-by-side comparison of user values vs database values
    - Provide option to accept DB values or resubmit with updated RowVersion
    - Display inline validation errors on 400
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

  - [x] 13.3 Create src/pages/departments/DepartmentDetails.tsx
    - Display Name, Budget (currency), Start Date, Administrator name
    - _Requirements: 9.7_

  - [ ]* 13.4 Write property test for budget currency formatting
    - **Property 13: Budget currency formatting** — for any non-negative decimal, formatted string includes currency symbol, thousands separators, and exactly two decimal places
    - **Validates: Requirements 9.1**

- [x] 14. Implement Instructors React pages
  - [x] 14.1 Create src/pages/instructors/InstructorList.tsx
    - Render MUI Table with Last Name, First Name, Hire Date, Office, Assigned Courses columns
    - Clicking an instructor row highlights it and shows assigned courses table below
    - Clicking a course row highlights it and shows enrollments table below
    - Include Create, Edit, Delete, Details action buttons/links
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 14.2 Create src/pages/instructors/InstructorCreate.tsx and InstructorEdit.tsx
    - Form with Last Name, First Name, Hire Date, Office Location, course checkboxes
    - Display all available courses as checkboxes; pre-check assigned ones on Edit
    - Include selected course IDs in POST/PUT request body
    - Display inline validation errors
    - On success, navigate to instructor list
    - _Requirements: 10.4, 10.5, 10.6, 10.7_

  - [x] 14.3 Create src/pages/instructors/InstructorDetails.tsx
    - Display instructor info, office location, list of assigned course titles
    - _Requirements: 10.9_

- [x] 15. Implement Notifications React dashboard
  - [x] 15.1 Create src/pages/notifications/NotificationDashboard.tsx
    - Fetch and display notifications ordered by createdAt descending
    - Implement 5-second polling with setInterval, cleanup on unmount
    - Merge new notifications: prepend, deduplicate by ID, cap at 50
    - Display message, entityType, operation, createdAt, createdBy for each item
    - Visually distinguish unread (different background) from read
    - "Mark as Read" button on unread items, calls mark-read endpoint
    - On mark-read failure, revert visual state and show error
    - On poll failure, show inline error, retain existing list, retry next interval
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 15.2 Write property test for notification list merge logic
    - **Property 14: Notification list merge preserves order and caps at 50** — for any existing list (0-50) and new batch (0-10), merged result has no duplicates, new items first, ordered by createdAt desc, length ≤ 50
    - **Validates: Requirements 11.2**

- [x] 16. Checkpoint - Ensure React app compiles and all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Final cleanup — remove old MVC view controllers
  - [x] 17.1 Remove legacy MVC controllers that are replaced by API controllers
    - Delete Controllers/HomeController.cs (replaced by SPA routing)
    - Delete Controllers/StudentsController.cs (replaced by Api/StudentsApiController)
    - Delete Controllers/CoursesController.cs (replaced by Api/CoursesApiController)
    - Delete Controllers/DepartmentsController.cs (replaced by Api/DepartmentsApiController)
    - Delete Controllers/InstructorsController.cs (replaced by Api/InstructorsApiController)
    - Delete Controllers/NotificationsController.cs (replaced by Api/NotificationsApiController)
    - Remove the Views/ folder entirely (all Razor views replaced by React pages)
    - Update any remaining startup/configuration to serve the SPA for non-API routes
    - Verify the project still compiles successfully after removal
    - _Requirements: 13.2, 13.3_

- [x] 18. Final checkpoint - Ensure full build and all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The API layer (tasks 3-7) can be developed in parallel since controllers are independent
- The React service layer (task 9) depends on TypeScript types (task 2.1) being complete
- React pages (tasks 11-15) depend on the service layer (task 9) and shared components (task 10)
- fast-check is the property-based testing library for TypeScript tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.2"] },
    { "id": 3, "tasks": ["3.1", "4.1", "5.1", "6.1", "7.1"] },
    { "id": 4, "tasks": ["3.2", "4.2", "5.2", "6.2", "7.2", "9.1"] },
    { "id": 5, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6"] },
    { "id": 6, "tasks": ["9.7", "10.1", "10.2", "10.3", "10.4"] },
    { "id": 7, "tasks": ["10.5"] },
    { "id": 8, "tasks": ["11.1", "12.1", "13.1", "14.1", "15.1"] },
    { "id": 9, "tasks": ["11.2", "11.3", "12.2", "12.3", "13.2", "13.3", "14.2", "14.3"] },
    { "id": 10, "tasks": ["11.4", "13.4", "15.2"] },
    { "id": 11, "tasks": ["17.1"] }
  ]
}
```
