# Contoso University - .NET 8 (Modernized)

This project is the modernized version of the Contoso University application, migrated from .NET Framework 4.8 / ASP.NET MVC 5 to .NET 8 / ASP.NET Core.

## Project Overview

### Framework
- ASP.NET Core (.NET 8)
- Kestrel web server (cross-platform, container-ready)

### Database Access
- Entity Framework Core 8.0 with Npgsql (PostgreSQL)

### Frontend
- Server-side: Razor Views with Bootstrap 5
- Client-side: React 18 SPA (TypeScript, Vite, React Router)

### Project Structure
```
ContosoUniversity-Modernized/
├── ClientApp/              # React SPA (Vite + TypeScript)
│   ├── src/                # React components and pages
│   ├── package.json        # Node dependencies
│   └── vite.config.ts      # Vite build configuration
├── Controllers/            # ASP.NET Core MVC Controllers
├── Data/                   # EF Core DbContext and initializer
├── Models/                 # Data models and view models
├── Services/               # Application services (notifications, logging)
├── Views/                  # Razor views
├── wwwroot/                # Static files
├── Uploads/                # File upload storage
├── Program.cs              # Application entry point and DI configuration
├── appsettings.json        # Configuration (connection strings, logging)
└── ContosoUniversity.csproj # SDK-style project file
```

## Key Changes from Legacy Version

| Area | Legacy (.NET Framework 4.8) | Modernized (.NET 8) |
|------|----------------------------|---------------------|
| Framework | ASP.NET MVC 5 | ASP.NET Core |
| Project format | Old-style .csproj + packages.config | SDK-style .csproj |
| Database | SQL Server LocalDB | PostgreSQL |
| ORM | EF Core 3.1.32 | EF Core 8.0 |
| Config | Web.config (XML) | appsettings.json |
| Entry point | Global.asax | Program.cs |
| Hosting | IIS Express (Windows-only) | Kestrel (cross-platform) |
| Frontend | jQuery + Bootstrap 3 | React 18 + Bootstrap 5 |
| Bundling | System.Web.Optimization | LigerShark WebOptimizer + Vite |
| Auth | Windows Authentication | ASP.NET Core Negotiate |

## Database Configuration

The application uses PostgreSQL with the following connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "SchoolContext": "Host=localhost;Port=5432;Database=ContosoUniversity;Username=<your-username>"
  }
}
```

See `setup_postgresql.sql` for database setup scripts.

## Running the Application

1. **Prerequisites**:
   - .NET 8 SDK
   - PostgreSQL
   - Node.js (for the React frontend)

2. **Setup**:
   ```bash
   # Restore .NET dependencies
   dotnet restore

   # Install frontend dependencies
   cd ClientApp && npm install && cd ..

   # Run the application
   dotnet run
   ```

3. **Frontend development** (optional, for hot-reload):
   ```bash
   cd ClientApp
   npm run dev
   ```

## Features

- **Student Management**: CRUD operations with pagination and search
- **Course Management**: Manage courses and department assignments
- **Instructor Management**: Handle instructor assignments and office locations
- **Department Management**: Manage departments and administrators
- **Statistics**: View enrollment statistics by date
- **Notifications**: Admin notification system for entity changes
- **Teaching Material Uploads**: File upload support with configurable size limits (10 MB)

## Notification System

The notification system alerts administrators when entity operations (create, update, delete) occur. See `NOTIFICATION_SYSTEM_README.md` for details.

## Migration Context

This is the "after" state of a .NET modernization demo. The corresponding legacy application is in the `ContosoUniversity-Legacy` folder at the repository root.
