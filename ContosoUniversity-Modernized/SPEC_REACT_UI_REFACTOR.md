# Spec: Refactor UI Layer from Razor Views to React App

## Summary

Replace the Razor Views + MVC Controller presentation layer with a React single-page application (SPA) served from the same ASP.NET Core application. MVC Controllers become API Controllers that return JSON. The React app consumes these APIs. The Data Layer (Entity Framework → PostgreSQL) remains unchanged.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│            ASP.NET Core Application                 │
│                                                     │
│  ┌──────────────┐       ┌────────────────────┐     │
│  │  React App   │──────►│  API Controllers   │     │
│  │  (wwwroot)   │       │  (JSON responses)  │     │
│  └──────────────┘       └─────────┬──────────┘     │
│                                   │                 │
│                Presentation Layer │                 │
├───────────────────────────────────┼─────────────────┤
│                                   │                 │
│                    ┌──────────────┴──────────┐      │
│                    │    Entity Framework     │      │
│                    └──────────────┬──────────┘      │
│                                   │                 │
│                       Data Layer  │                 │
└───────────────────────────────────┼─────────────────┘
                                    │
                              ┌─────┴─────┐
                              │PostgreSQL  │
                              └───────────┘
```

## Current State

| Component | Technology | Count |
|-----------|-----------|-------|
| Views | Razor `.cshtml` | ~20 files across 6 view folders |
| Controllers | MVC (return `View()`) | 5 controllers |
| Layout | `_Layout.cshtml` + Bootstrap 3 | 1 shared layout |
| JS | jQuery + vanilla JS | Multiple script files |
| CSS | Bootstrap + custom `Site.css` | 2 CSS files |
| Routing | Server-side (`{controller}/{action}/{id}`) | Convention-based |

### Pages to convert:

| Area | Pages |
|------|-------|
| Home | Index, About, Contact |
| Students | Index (paginated, searchable, sortable), Create, Edit, Details, Delete |
| Courses | Index, Create, Edit, Details, Delete |
| Instructors | Index (with course assignments), Create, Edit, Details, Delete |
| Departments | Index, Create, Edit, Details, Delete |

---

## Proposed Design

### 1. API Controllers (replace MVC Controllers)

Convert each controller from returning `View()` to returning JSON via `[ApiController]`.

**Route convention:** `/api/{entity}`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/students` | GET | List with pagination, search, sort |
| `/api/students/{id}` | GET | Single student with enrollments |
| `/api/students` | POST | Create student |
| `/api/students/{id}` | PUT | Update student |
| `/api/students/{id}` | DELETE | Delete student |
| `/api/courses` | GET | List with department info |
| `/api/courses/{id}` | GET | Single course |
| `/api/courses` | POST | Create course |
| `/api/courses/{id}` | PUT | Update course |
| `/api/courses/{id}` | DELETE | Delete course |
| `/api/instructors` | GET | List with office + course assignments |
| `/api/instructors/{id}` | GET | Single instructor |
| `/api/instructors` | POST | Create instructor |
| `/api/instructors/{id}` | PUT | Update instructor |
| `/api/instructors/{id}` | DELETE | Delete instructor |
| `/api/departments` | GET | List all |
| `/api/departments/{id}` | GET | Single department |
| `/api/departments` | POST | Create department |
| `/api/departments/{id}` | PUT | Update department |
| `/api/departments/{id}` | DELETE | Delete department |
| `/api/stats/enrollments` | GET | Enrollment date groups (About page) |

**Example controller transformation:**

```csharp
[ApiController]
[Route("api/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly SchoolContext _db;
    private readonly INotificationService _notificationService;

    [HttpGet]
    public ActionResult<PaginatedResult<StudentDto>> GetAll(
        string sortOrder, string searchString, int page = 1, int pageSize = 10) { ... }

    [HttpGet("{id}")]
    public ActionResult<StudentDetailDto> Get(int id) { ... }

    [HttpPost]
    public ActionResult<StudentDto> Create(CreateStudentRequest request) { ... }

    [HttpPut("{id}")]
    public ActionResult<StudentDto> Update(int id, UpdateStudentRequest request) { ... }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id) { ... }
}
```

### 2. React App

Hosted as static files from `wwwroot/` (built output) with source in a `ClientApp/` directory.

#### Project Structure

```
ContosoUniversity/
├── ClientApp/                    ← React source
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   └── client.ts         ← API client (fetch wrapper)
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── ConfirmDelete.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── About.tsx
│   │   │   ├── students/
│   │   │   │   ├── StudentList.tsx
│   │   │   │   ├── StudentCreate.tsx
│   │   │   │   ├── StudentEdit.tsx
│   │   │   │   ├── StudentDetails.tsx
│   │   │   │   └── StudentDelete.tsx
│   │   │   ├── courses/
│   │   │   ├── instructors/
│   │   │   └── departments/
│   │   └── types/
│   │       └── models.ts
│   └── public/
├── Controllers/                  ← API controllers (JSON)
├── Data/
├── Models/
├── Services/
└── Program.cs
```

#### Technology Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | React 18 | Requested |
| Language | TypeScript | Type safety with API contracts |
| Build tool | Vite | Fast dev server, simple config |
| Routing | React Router v6 | Client-side SPA routing |
| HTTP client | Fetch API (thin wrapper) | No extra dependency |
| Styling | Bootstrap 5 | Familiar, matches existing look |
| State management | React hooks (`useState`, `useEffect`) | App is simple CRUD, no need for Redux |

#### Client-Side Routes

| Route | Component | API Call |
|-------|-----------|----------|
| `/` | Home | None |
| `/about` | About | `GET /api/stats/enrollments` |
| `/students` | StudentList | `GET /api/students?sort=&search=&page=` |
| `/students/create` | StudentCreate | `POST /api/students` |
| `/students/:id` | StudentDetails | `GET /api/students/:id` |
| `/students/:id/edit` | StudentEdit | `PUT /api/students/:id` |
| `/students/:id/delete` | StudentDelete | `DELETE /api/students/:id` |
| `/courses` | CourseList | `GET /api/courses` |
| `/courses/create` | CourseCreate | `POST /api/courses` |
| `/courses/:id` | CourseDetails | `GET /api/courses/:id` |
| `/courses/:id/edit` | CourseEdit | `PUT /api/courses/:id` |
| `/courses/:id/delete` | CourseDelete | `DELETE /api/courses/:id` |
| `/instructors` | InstructorList | `GET /api/instructors` |
| `/instructors/create` | InstructorCreate | `POST /api/instructors` |
| `/instructors/:id` | InstructorDetails | `GET /api/instructors/:id` |
| `/instructors/:id/edit` | InstructorEdit | `PUT /api/instructors/:id` |
| `/instructors/:id/delete` | InstructorDelete | `DELETE /api/instructors/:id` |
| `/departments` | DepartmentList | `GET /api/departments` |
| `/departments/create` | DepartmentCreate | `POST /api/departments` |
| `/departments/:id` | DepartmentDetails | `GET /api/departments/:id` |
| `/departments/:id/edit` | DepartmentEdit | `PUT /api/departments/:id` |
| `/departments/:id/delete` | DepartmentDelete | `DELETE /api/departments/:id` |

### 3. ASP.NET Core Hosting Configuration

```csharp
// Program.cs
app.UseStaticFiles(); // Serves React build from wwwroot/

// SPA fallback — serve index.html for client-side routes
app.MapFallbackToFile("index.html");
```

During development, use Vite dev server with proxy:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  build: {
    outDir: '../wwwroot'
  }
});
```

### 4. DTOs (API Response Models)

```csharp
public record StudentDto(int Id, string LastName, string FirstMidName, DateTime EnrollmentDate);
public record StudentDetailDto(int Id, string LastName, string FirstMidName, DateTime EnrollmentDate, List<EnrollmentDto> Enrollments);
public record CreateStudentRequest(string LastName, string FirstMidName, DateTime EnrollmentDate);
public record CourseDto(int CourseId, string Title, int Credits, string DepartmentName);
public record InstructorDto(int Id, string LastName, string FirstMidName, DateTime HireDate, string OfficeLocation, List<string> Courses);
public record DepartmentDto(int DepartmentId, string Name, decimal Budget, DateTime StartDate, string AdministratorName);
public record PaginatedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize);
```

---

## What Gets Removed

| Item | Reason |
|------|--------|
| `Views/` folder (all `.cshtml` files) | Replaced by React components |
| `_ViewImports.cshtml`, `_ViewStart.cshtml` | Razor infrastructure |
| `wwwroot/Scripts/` (jQuery, validate, etc.) | React handles UI |
| `wwwroot/Content/` (Site.css) | Replaced by React styling |
| `Scripts/` folder (root level) | Legacy |
| `PaginatedList.cs` | Pagination moves to API response DTO |
| `ViewBag` / `ViewData` usage | Replaced by API JSON responses |
| `[ValidateAntiForgeryToken]` | Replaced by API auth patterns (CORS, etc.) |

## What Stays

| Item | Reason |
|------|--------|
| `Data/SchoolContext.cs` | Data layer unchanged |
| `Models/` (entity classes) | EF entities stay |
| `Services/INotificationService.cs` | SQS producer stays |
| `Services/SqsNotificationService.cs` | SQS producer stays |
| `Program.cs` | Updated for API + SPA hosting |
| `appsettings.json` | Configuration stays |

---

## Migration Steps

| # | Step |
|---|------|
| 1 | Create `ClientApp/` with Vite + React + TypeScript scaffold |
| 2 | Add DTOs and `PaginatedResult<T>` response model |
| 3 | Convert `StudentsController` to API controller |
| 4 | Build `StudentList`, `StudentCreate`, `StudentEdit`, `StudentDetails`, `StudentDelete` React pages |
| 5 | Convert `CoursesController` to API controller |
| 6 | Build Courses React pages |
| 7 | Convert `InstructorsController` to API controller |
| 8 | Build Instructors React pages |
| 9 | Convert `DepartmentsController` to API controller |
| 10 | Build Departments React pages |
| 11 | Convert `HomeController` to API controller (stats endpoint) |
| 12 | Build Home, About pages in React |
| 13 | Add `Layout`, `Navbar`, shared components |
| 14 | Configure `Program.cs` for SPA fallback |
| 15 | Configure Vite build output to `wwwroot/` |
| 16 | Remove all Razor views, jQuery, old CSS |
| 17 | Test all CRUD flows end-to-end |

## Out of Scope

- Authentication/authorization UI
- Notification UI (extracted to separate service)
- Server-side rendering (SSR)
- Unit tests for React components (can add later)
- CSS-in-JS or Tailwind (stick with Bootstrap 5 for parity)
