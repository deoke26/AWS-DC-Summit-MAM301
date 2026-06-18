# Requirements Document

## Introduction

This feature refactors the Contoso University Modernized application's UI layer from server-rendered MVC Razor Views to a decoupled architecture consisting of REST API controllers and a React single-page application. The React frontend will be built with Vite, TypeScript, and Material UI, and will consume the new API endpoints. All existing page functionality (Students, Courses, Departments, Instructors, Notifications) will be replicated in the React application without adding new features.

## Assumptions

- The existing Entity Framework Core data layer, models, and database schema remain unchanged.
- The existing MVC controllers remain in place during development and are removed only in a final cleanup task.
- The React app is served separately during development (Vite dev server on port 5173) and proxies API calls to the .NET backend on port 5050.
- File uploads for teaching materials use multipart/form-data and are stored on the local filesystem under Uploads/TeachingMaterials/.
- The notification polling in the React app fetches from the Notifications API controller, which reads from the existing in-memory queue or SQS-backed notification service.
- No authentication or authorization is required for any API endpoint or React page.
- No server-side rendering is used; the React app is a client-side SPA.
- The existing ClientApp/ folder will be deleted and replaced with a new client-app/ folder.
- The page size for server-side pagination on the Students list is 10 items per page.

## Glossary

- **API_Controller**: An ASP.NET Core controller decorated with [ApiController] that returns JSON responses, located under Controllers/Api/.
- **React_App**: The Vite-based TypeScript React single-page application located at ContosoUniversity-Modernized/client-app/.
- **Student_Service**: The React service module responsible for making HTTP requests to the Students API endpoints.
- **Course_Service**: The React service module responsible for making HTTP requests to the Courses API endpoints.
- **Department_Service**: The React service module responsible for making HTTP requests to the Departments API endpoints.
- **Instructor_Service**: The React service module responsible for making HTTP requests to the Instructors API endpoints.
- **Notification_Service**: The React service module responsible for making HTTP requests to the Notifications API endpoints.
- **Paginated_Response**: A JSON response envelope containing items, pageIndex, totalPages, totalCount, hasPreviousPage, and hasNextPage fields.
- **Concurrency_Conflict**: A condition where a PUT request to update a Department fails because the RowVersion provided does not match the current database value.
- **Teaching_Material_Upload**: A file upload of an image (jpg, jpeg, png, gif, bmp) associated with a Course, limited to 5 MB.

## Requirements

### Requirement 1: Students API Controller

**User Story:** As a frontend developer, I want REST API endpoints for Student CRUD operations, so that the React application can manage student data.

#### Acceptance Criteria

1. WHEN a GET request is sent to /api/students with optional query parameters (page, pageSize, sortOrder, searchString), THE API_Controller SHALL return a Paginated_Response containing the matching students, where page defaults to 1, pageSize defaults to 10 and accepts values between 1 and 50, sortOrder accepts values "name_asc", "name_desc", "date_asc", or "date_desc" defaulting to "name_asc", and searchString filters students whose LastName or FirstMidName contains the provided text (max 50 characters).
2. WHEN a GET request is sent to /api/students with valid parameters, THE API_Controller SHALL return a Paginated_Response that includes the list of student records, the current page index, total pages, hasPreviousPage, and hasNextPage indicators.
3. WHEN a GET request is sent to /api/students/{id}, THE API_Controller SHALL return the student record including ID, LastName, FirstMidName, EnrollmentDate, and a list of enrollments each containing the course name and grade.
4. IF a GET request is sent to /api/students/{id} and no student with that ID exists, THEN THE API_Controller SHALL return HTTP status 404.
5. WHEN a POST request with valid student data is sent to /api/students, THE API_Controller SHALL create the student and return HTTP status 201 with the created student in the response body, where valid student data requires LastName (non-empty, max 50 characters), FirstMidName (non-empty, max 50 characters), and EnrollmentDate (a valid date between 1753-01-01 and 9999-12-31).
6. IF a POST request is sent to /api/students with missing required fields (LastName, FirstMidName, or EnrollmentDate), fields exceeding 50 characters, or an EnrollmentDate outside the range 1753-01-01 to 9999-12-31, THEN THE API_Controller SHALL return HTTP status 400 with a response body containing field-level validation error details.
7. WHEN a PUT request with valid student data is sent to /api/students/{id}, THE API_Controller SHALL update the student and return HTTP status 200 with the updated student in the response body, applying the same validation rules as for creation.
8. IF a PUT request is sent to /api/students/{id} and no student with that ID exists, THEN THE API_Controller SHALL return HTTP status 404.
9. WHEN a DELETE request is sent to /api/students/{id}, THE API_Controller SHALL delete the student and return HTTP status 204.
10. IF a DELETE request is sent to /api/students/{id} and no student with that ID exists, THEN THE API_Controller SHALL return HTTP status 404.

### Requirement 2: Courses API Controller

**User Story:** As a frontend developer, I want REST API endpoints for Course CRUD operations including file upload, so that the React application can manage course data and teaching materials.

#### Acceptance Criteria

1. WHEN a GET request is sent to /api/courses, THE API_Controller SHALL return HTTP status 200 with a JSON array of all courses, each including CourseID, Title, Credits, DepartmentID, Department Name, and TeachingMaterialImagePath.
2. WHEN a GET request is sent to /api/courses/{id}, THE API_Controller SHALL return HTTP status 200 with a JSON object containing the course record including CourseID, Title, Credits, DepartmentID, Department Name, and TeachingMaterialImagePath.
3. IF a GET request is sent to /api/courses/{id} and no course with that ID exists, THEN THE API_Controller SHALL return HTTP status 404.
4. WHEN a POST request with valid course data (Title between 3 and 50 characters, Credits between 0 and 5, and a valid DepartmentID referencing an existing department) and an optional Teaching_Material_Upload is sent as multipart/form-data to /api/courses, THE API_Controller SHALL create the course, save the uploaded file with a unique filename, and return HTTP status 201 with the created course record.
5. IF a POST or PUT request to /api/courses is sent with invalid course data (Title missing or outside 3-50 characters, Credits outside 0-5 range, or DepartmentID not referencing an existing department), THEN THE API_Controller SHALL return HTTP status 400 with a validation error message indicating the invalid fields.
6. IF a POST or PUT request to /api/courses includes a file with a disallowed extension (not .jpg, .jpeg, .png, .gif, or .bmp), THEN THE API_Controller SHALL return HTTP status 400 with a validation error message indicating the allowed file types.
7. IF a POST or PUT request to /api/courses includes a file exceeding 5 MB, THEN THE API_Controller SHALL return HTTP status 400 with a validation error message indicating the maximum allowed file size.
8. WHEN a PUT request with valid course data and an optional Teaching_Material_Upload is sent to /api/courses/{id} and a course with that ID exists, THE API_Controller SHALL update the course, delete the previously stored file and save the new uploaded file if a new file is provided, and return HTTP status 200 with the updated course record.
9. IF a PUT request is sent to /api/courses/{id} and no course with that ID exists, THEN THE API_Controller SHALL return HTTP status 404.
10. WHEN a DELETE request is sent to /api/courses/{id} and a course with that ID exists, THE API_Controller SHALL delete the course record, remove the associated teaching material file from disk if one exists, and return HTTP status 204 with no response body.
11. IF a DELETE request is sent to /api/courses/{id} and no course with that ID exists, THEN THE API_Controller SHALL return HTTP status 404.

### Requirement 3: Departments API Controller

**User Story:** As a frontend developer, I want REST API endpoints for Department CRUD operations with optimistic concurrency support, so that the React application can manage department data safely.

#### Acceptance Criteria

1. WHEN a GET request is sent to /api/departments, THE API_Controller SHALL return a list of all departments including each department's administrator full name.
2. WHEN a GET request is sent to /api/departments/{id}, THE API_Controller SHALL return the department record including the administrator full name and the current RowVersion value.
3. IF a GET request is sent to /api/departments/{id} and no department with that ID exists, THEN THE API_Controller SHALL return HTTP status 404.
4. WHEN a POST request with valid department data is sent to /api/departments, THE API_Controller SHALL create the department and return HTTP status 201 with the created resource including the assigned DepartmentID and RowVersion, where valid department data requires: Name (string, 3 to 50 characters), Budget (decimal, 0.00 to 999,999,999.99), StartDate (valid date), and InstructorID (optional, must reference an existing instructor if provided).
5. IF a POST or PUT request is sent with department data that fails validation, THEN THE API_Controller SHALL return HTTP status 400 with error messages indicating which fields failed validation.
6. WHEN a PUT request with valid department data and a matching RowVersion is sent to /api/departments/{id}, THE API_Controller SHALL update the department and return HTTP status 200 with the updated RowVersion.
7. IF a PUT request is sent to /api/departments/{id} and no department with that ID exists, THEN THE API_Controller SHALL return HTTP status 404.
8. IF a PUT request is sent to /api/departments/{id} with a RowVersion that does not match the current database value, THEN THE API_Controller SHALL return HTTP status 409 with the current database values for all department fields to inform the client of the Concurrency_Conflict.
9. WHEN a DELETE request is sent to /api/departments/{id}, THE API_Controller SHALL delete the department and return HTTP status 204.
10. IF a DELETE request is sent to /api/departments/{id} and no department with that ID exists, THEN THE API_Controller SHALL return HTTP status 404.

### Requirement 4: Instructors API Controller

**User Story:** As a frontend developer, I want REST API endpoints for Instructor CRUD operations with course assignment management, so that the React application can manage instructor data and their course assignments.

#### Acceptance Criteria

1. WHEN a GET request is sent to /api/instructors, THE API_Controller SHALL return a list of all instructors ordered by last name, where each instructor record includes their office assignment location (if any) and an array of assigned course IDs.
2. WHEN a GET request is sent to /api/instructors/{id}, THE API_Controller SHALL return the instructor record including first name, last name, hire date, office assignment location (if any), assigned courses with their IDs and titles, and enrollments for each assigned course.
3. IF a GET request is sent to /api/instructors/{id} and no instructor with that ID exists, THEN THE API_Controller SHALL return HTTP status 404.
4. WHEN a POST request with instructor data containing a required last name (max 50 characters), required first name (max 50 characters), required hire date, optional office location (max 50 characters), and optional array of course IDs is sent to /api/instructors, THE API_Controller SHALL create the instructor with the specified course assignments and return HTTP status 201 with the created instructor record.
5. IF a POST request is sent to /api/instructors with missing or invalid required fields (last name, first name, or hire date), THEN THE API_Controller SHALL return HTTP status 400 with an error response indicating which fields failed validation.
6. WHEN a PUT request with instructor data containing a required last name (max 50 characters), required first name (max 50 characters), required hire date, optional office location (max 50 characters), and optional array of course IDs is sent to /api/instructors/{id}, THE API_Controller SHALL update the instructor, add course assignments for newly included course IDs, remove course assignments for omitted course IDs, and return HTTP status 200 with the updated instructor record.
7. IF a PUT request is sent to /api/instructors/{id} and no instructor with that ID exists, THEN THE API_Controller SHALL return HTTP status 404.
8. IF a PUT request is sent to /api/instructors/{id} with missing or invalid required fields (last name, first name, or hire date), THEN THE API_Controller SHALL return HTTP status 400 with an error response indicating which fields failed validation.
9. WHEN a DELETE request is sent to /api/instructors/{id}, THE API_Controller SHALL delete the instructor, remove the associated office assignment, set the administrator reference to null on any department where this instructor is the administrator, and return HTTP status 204.
10. IF a DELETE request is sent to /api/instructors/{id} and no instructor with that ID exists, THEN THE API_Controller SHALL return HTTP status 404.

### Requirement 5: Notifications API Controller

**User Story:** As a frontend developer, I want REST API endpoints for retrieving and managing notifications, so that the React application can display a live notification dashboard.

#### Acceptance Criteria

1. WHEN a GET request is sent to /api/notifications, THE API_Controller SHALL return HTTP status 200 with a JSON response containing a list of unread notifications (where isRead is false), limited to a maximum of 10 notifications per request, ordered by createdAt descending, with each notification containing the fields: id (integer), entityType (string, max 100 characters), entityId (string, max 50 characters), operation (one of "CREATE", "UPDATE", "DELETE"), message (string, max 256 characters), createdAt (ISO 8601 datetime), createdBy (string, max 100 characters), and isRead (boolean).
2. WHEN a POST request is sent to /api/notifications/{id}/mark-read with a valid integer notification ID, THE API_Controller SHALL set the notification's isRead field to true, set the readAt field to the current timestamp, and return HTTP status 200.
3. IF a POST request is sent to /api/notifications/{id}/mark-read and no notification with that ID exists, THEN THE API_Controller SHALL return HTTP status 404 with a JSON response containing an error message indicating the notification was not found.
4. IF a GET request to /api/notifications fails due to an internal error, THEN THE API_Controller SHALL return HTTP status 500 with a JSON response containing an error message indicating the failure reason.
5. IF a POST request is sent to /api/notifications/{id}/mark-read with an ID that is not a valid positive integer, THEN THE API_Controller SHALL return HTTP status 400 with a JSON response containing an error message indicating the ID format is invalid.

### Requirement 6: React Application Setup

**User Story:** As a developer, I want a properly configured React application with Vite, TypeScript, and Material UI, so that I have a modern development environment for building the frontend.

#### Acceptance Criteria

1. THE React_App SHALL be located at ContosoUniversity-Modernized/client-app/ with the project initialized using Vite with the React TypeScript template.
2. THE React_App SHALL include Material UI (@mui/material, @mui/icons-material, @emotion/react, @emotion/styled) as UI component dependencies.
3. THE React_App SHALL configure the Vite dev server to run on port 5173 and proxy all requests with the /api prefix to http://localhost:5050.
4. THE React_App SHALL organize source code into src/pages/, src/components/, src/services/, and src/types/ directories.
5. THE React_App SHALL use react-router-dom for client-side navigation and define routes for /students, /courses, /departments, /instructors, and /notifications paths, with the root path (/) redirecting to /students.
6. THE React_App SHALL render a shared layout component on every route that includes a top navigation bar with links labeled "Students", "Courses", "Departments", "Instructors", and "Notifications", each navigating to their respective route path.
7. THE React_App SHALL compile without TypeScript errors and produce a production build via the "npm run build" command that completes with a zero exit code.

### Requirement 7: Students React Pages

**User Story:** As a university administrator, I want to manage students through a web interface with pagination, search, and sorting, so that I can efficiently handle student records.

#### Acceptance Criteria

1. WHEN the Students list page is loaded, THE React_App SHALL display a paginated table of students with columns for Last Name, First Name, and Enrollment Date, showing 10 students per page sorted by Last Name ascending by default.
2. WHEN a user enters text in the search field on the Students list page, THE React_App SHALL send a filtered request to the Student_Service matching against Last Name and First Name, reset pagination to page 1, and display matching results.
3. WHEN a user clicks a sortable column header (Last Name or Enrollment Date) on the Students list page, THE React_App SHALL request data sorted by that column from the Student_Service, toggling between ascending and descending order on repeated clicks, and display the sorted results.
4. WHEN a user clicks Next or Previous pagination controls on the Students list page, THE React_App SHALL request the corresponding page from the Student_Service and display the results, disabling the Previous button on page 1 and the Next button on the last page.
5. WHEN a user submits the Create Student form with a Last Name (max 50 characters), First Name (max 50 characters), and Enrollment Date, THE React_App SHALL send a POST request via the Student_Service and navigate to the Students list on success.
6. IF the Student_Service returns validation errors after a create or edit submission, THEN THE React_App SHALL display the error messages inline adjacent to the corresponding form fields without clearing the user's entered data.
7. WHEN a user submits the Edit Student form with valid Last Name (max 50 characters), First Name (max 50 characters), and Enrollment Date, THE React_App SHALL send a PUT request via the Student_Service and navigate to the Students list on success.
8. WHEN a user clicks the delete action for a student, THE React_App SHALL display a confirmation dialog, and IF the user confirms, THE React_App SHALL send a DELETE request via the Student_Service and remove the student from the displayed list.
9. WHEN a user navigates to the Student Details page, THE React_App SHALL display the student's Last Name, First Name, Enrollment Date, and a list of their course enrollments showing course title and grade for each enrollment.

### Requirement 8: Courses React Pages

**User Story:** As a university administrator, I want to manage courses including uploading teaching materials, so that I can maintain course information and associated files.

#### Acceptance Criteria

1. WHEN the Courses list page is loaded, THE React_App SHALL display a table of courses with columns for Course Number, Title, Credits, and Department, showing all courses returned by the Course_Service.
2. WHEN a user submits the Create Course form with a Course Number, Title, Credits, selected Department, and an optional image file (jpg, jpeg, png, gif, or bmp up to 5 MB), THE React_App SHALL send a multipart/form-data POST request via the Course_Service and navigate to the Courses list on success.
3. IF the Course_Service returns a validation error after a create or edit submission (including invalid file type, file size exceeding 5 MB, or invalid course field data), THEN THE React_App SHALL display the validation error messages inline on the form without navigating away.
4. WHEN a user submits the Edit Course form with valid data and an optional replacement image file, THE React_App SHALL send a multipart/form-data PUT request via the Course_Service and navigate to the Courses list on success.
5. WHEN a user requests deletion of a course, THE React_App SHALL present a confirmation dialog before sending the DELETE request via the Course_Service, and remove the course from the displayed list on success.
6. WHEN a user navigates to the Course Details page, THE React_App SHALL display the Course Number, Title, Credits, Department name, and the teaching material image rendered as a visible image element if a TeachingMaterialImagePath is present for that course.

### Requirement 9: Departments React Pages

**User Story:** As a university administrator, I want to manage departments with concurrency conflict detection, so that simultaneous edits are handled gracefully.

#### Acceptance Criteria

1. WHEN the Departments list page is loaded, THE React_App SHALL display a table of departments with columns for Name, Budget (formatted as currency), Start Date (formatted as a date), and Administrator (full name of the assigned instructor, or empty if none assigned).
2. WHEN a user submits the Create Department form with valid data, THE React_App SHALL send a POST request via the Department_Service and navigate to the Departments list on success.
3. WHEN a user submits the Edit Department form with valid data, THE React_App SHALL include the RowVersion in the PUT request via the Department_Service and navigate to the Departments list on success.
4. IF the Department_Service returns HTTP status 409 (Concurrency_Conflict) during an edit submission, THEN THE React_App SHALL display the current database values for Name, Budget, Start Date, and Administrator alongside the user's submitted values, and provide the user with the option to either accept the database values or resubmit their changes with the updated RowVersion.
5. IF the Department_Service returns HTTP status 400 after a create or edit submission, THEN THE React_App SHALL display the validation error messages from the response body inline on the form.
6. WHEN a user confirms deletion of a department, THE React_App SHALL send a DELETE request via the Department_Service and remove the department from the displayed list.
7. WHEN a user navigates to the Department Details page, THE React_App SHALL display the department Name, Budget (formatted as currency), Start Date (formatted as a date), and Administrator name.

### Requirement 10: Instructors React Pages

**User Story:** As a university administrator, I want to manage instructors and their course assignments, so that I can maintain instructor records and teaching responsibilities.

#### Acceptance Criteria

1. WHEN the Instructors list page is loaded, THE React_App SHALL display a table of instructors with columns for Last Name, First Name, Hire Date, Office (location string or empty if none), and Assigned Courses (displayed as a comma-separated list of course titles).
2. WHEN a user clicks on a row in the instructors table, THE React_App SHALL highlight the selected row and display a courses table below the instructors table showing the courses assigned to that instructor with columns for Course Number, Title, and Department.
3. WHEN a user clicks on a row in the assigned courses table, THE React_App SHALL highlight the selected course row and display an enrollments table below the courses table showing student Name and Grade (or "No grade" if null) for that course.
4. WHEN a user submits the Create Instructor form with a Last Name (max 50 characters), First Name (max 50 characters), Hire Date, optional Office location (max 50 characters), and selected courses, THE React_App SHALL send a POST request via the Instructor_Service including the selected course IDs and navigate to the Instructors list on success.
5. WHEN a user submits the Edit Instructor form with updated data and course selections, THE React_App SHALL send a PUT request via the Instructor_Service including the updated course IDs and navigate to the Instructors list on success.
6. THE React_App SHALL display all available courses as a list of checkboxes on the Create and Edit Instructor forms, with previously assigned courses pre-checked on the Edit form.
7. IF the Instructor_Service returns validation errors after a create or edit submission, THEN THE React_App SHALL display the error messages inline on the form without navigating away.
8. WHEN a user confirms deletion of an instructor via a confirmation dialog, THE React_App SHALL send a DELETE request via the Instructor_Service and remove the instructor from the displayed list.
9. WHEN a user navigates to the Instructor Details page, THE React_App SHALL display the instructor's Last Name, First Name, Hire Date, office assignment location, and a list of assigned course titles.

### Requirement 11: Notifications React Dashboard

**User Story:** As a university administrator, I want a live notification dashboard that displays recent system activity, so that I can monitor changes to university data in near real-time.

#### Acceptance Criteria

1. WHEN the Notifications page is loaded, THE React_App SHALL fetch notifications from the Notification_Service and display them in a list ordered by createdAt descending (newest first), showing for each notification: the message, entityType, operation, createdAt timestamp, and createdBy value.
2. WHILE the Notifications page is open, THE React_App SHALL poll the Notification_Service every 5 seconds for new notifications and prepend them to the top of the displayed list without removing existing entries, up to a maximum of 50 displayed notifications.
3. WHEN a user clicks "Mark as Read" on a notification, THE React_App SHALL send a POST request to the Notification_Service to mark it as read and update the visual state of that notification to reflect the read status.
4. THE React_App SHALL visually distinguish unread notifications from read notifications by applying a different background color to unread items and removing the "Mark as Read" action from notifications that are already read.
5. IF the Notification_Service returns an error or is unreachable during the initial fetch or a poll cycle, THEN THE React_App SHALL display an error message indicating that notifications could not be loaded and retry on the next poll interval.
6. IF the POST request to mark a notification as read fails, THEN THE React_App SHALL revert the notification's visual state to unread and display an error message indicating the operation failed.

### Requirement 12: API Integration and Error Handling

**User Story:** As a developer, I want consistent API integration patterns with proper error handling, so that the React application handles failures gracefully.

#### Acceptance Criteria

1. THE React_App SHALL use a centralized HTTP client configured with the /api base path for all API requests, with a default request timeout of 30 seconds.
2. IF an API request returns HTTP status 404, THEN THE React_App SHALL navigate to a dedicated "Not Found" page informing the user that the requested resource does not exist.
3. IF an API request returns HTTP status 400, THEN THE React_App SHALL display the validation errors from the response body on the relevant form fields.
4. IF an API request returns HTTP status 409 (Concurrency_Conflict), THEN THE React_App SHALL display the conflict resolution UI specific to the entity being edited (applicable to Departments).
5. IF an API request returns HTTP status 500 or a network error (including timeout), THEN THE React_App SHALL display a generic error notification that auto-dismisses after 8 seconds.
6. WHILE an API request is in progress, THE React_App SHALL display a loading indicator to the user.

### Requirement 13: Delete Existing ClientApp Folder

**User Story:** As a developer, I want the old ClientApp/ folder removed, so that there is no confusion between the legacy and new frontend codebases.

#### Acceptance Criteria

1. WHEN the React_App project setup is performed, THE build process SHALL recursively delete the ContosoUniversity-Modernized/ClientApp/ directory such that the directory and all of its files and subdirectories no longer exist on disk.
2. WHEN the React_App setup is complete, THE ContosoUniversity-Modernized project SHALL contain no file-system references to the ClientApp/ path in its .csproj or configuration files.
3. WHEN the React_App setup is complete, THE React_App source code SHALL exist solely in ContosoUniversity-Modernized/client-app/ and no other frontend application directory SHALL exist under ContosoUniversity-Modernized/.
