using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ContosoUniversity.Data;
using ContosoUniversity.Models;
using ContosoUniversity.Models.Dtos;
using ContosoUniversity.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Controllers.Api
{
    [ApiController]
    [Route("api/courses")]
    public class CoursesApiController : ControllerBase
    {
        private readonly SchoolContext _db;
        private readonly INotificationService _notificationService;
        private readonly IWebHostEnvironment _env;

        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".bmp" };
        private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

        public CoursesApiController(SchoolContext db, INotificationService notificationService, IWebHostEnvironment env)
        {
            _db = db;
            _notificationService = notificationService;
            _env = env;
        }

        [HttpGet]
        public async Task<ActionResult<List<CourseDto>>> GetCourses()
        {
            var courses = await _db.Courses
                .Include(c => c.Department)
                .Select(c => new CourseDto(
                    c.CourseID,
                    c.Title,
                    c.Credits,
                    c.DepartmentID,
                    c.Department.Name,
                    c.TeachingMaterialImagePath))
                .ToListAsync();

            return Ok(courses);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CourseDetailDto>> GetCourse(int id)
        {
            var course = await _db.Courses
                .Include(c => c.Department)
                .Include(c => c.CourseAssignments)
                    .ThenInclude(ca => ca.Instructor)
                .FirstOrDefaultAsync(c => c.CourseID == id);

            if (course == null)
                return NotFound();

            var instructors = course.CourseAssignments
                .Select(ca => $"{ca.Instructor.LastName}, {ca.Instructor.FirstMidName}")
                .ToList();

            var dto = new CourseDetailDto(
                course.CourseID,
                course.Title,
                course.Credits,
                course.DepartmentID,
                course.Department.Name,
                instructors);

            return Ok(dto);
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<CourseDto>> CreateCourse(
            [FromForm] int courseId,
            [FromForm] string title,
            [FromForm] int credits,
            [FromForm] int departmentId,
            IFormFile file)
        {
            // Validate required fields
            var errors = new Dictionary<string, string[]>();

            if (string.IsNullOrWhiteSpace(title) || title.Length < 3 || title.Length > 50)
                errors["title"] = new[] { "Title must be between 3 and 50 characters" };

            if (credits < 0 || credits > 5)
                errors["credits"] = new[] { "Credits must be between 0 and 5" };

            var department = await _db.Departments.FindAsync(departmentId);
            if (department == null)
                errors["departmentId"] = new[] { "Department not found" };

            // Validate file if provided
            if (file != null && file.Length > 0)
            {
                var fileValidationError = ValidateFile(file);
                if (fileValidationError != null)
                    errors["file"] = new[] { fileValidationError };
            }

            if (errors.Count > 0)
                return BadRequest(new { errors });

            var course = new Course
            {
                CourseID = courseId,
                Title = title,
                Credits = credits,
                DepartmentID = departmentId
            };

            // Handle file upload
            if (file != null && file.Length > 0)
            {
                course.TeachingMaterialImagePath = await SaveFileAsync(file);
            }

            _db.Courses.Add(course);
            await _db.SaveChangesAsync();

            _notificationService.SendNotification(
                "Course",
                course.CourseID.ToString(),
                course.Title,
                EntityOperation.CREATE,
                "System");

            var dto = new CourseDto(
                course.CourseID,
                course.Title,
                course.Credits,
                course.DepartmentID,
                department?.Name ?? "",
                course.TeachingMaterialImagePath);

            return CreatedAtAction(nameof(GetCourse), new { id = course.CourseID }, dto);
        }

        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<CourseDto>> UpdateCourse(
            int id,
            [FromForm] string title,
            [FromForm] int credits,
            [FromForm] int departmentId,
            IFormFile file)
        {
            var course = await _db.Courses.FindAsync(id);
            if (course == null)
                return NotFound();

            // Validate fields
            var errors = new Dictionary<string, string[]>();

            if (string.IsNullOrWhiteSpace(title) || title.Length < 3 || title.Length > 50)
                errors["title"] = new[] { "Title must be between 3 and 50 characters" };

            if (credits < 0 || credits > 5)
                errors["credits"] = new[] { "Credits must be between 0 and 5" };

            var department = await _db.Departments.FindAsync(departmentId);
            if (department == null)
                errors["departmentId"] = new[] { "Department not found" };

            // Validate file if provided
            if (file != null && file.Length > 0)
            {
                var fileValidationError = ValidateFile(file);
                if (fileValidationError != null)
                    errors["file"] = new[] { fileValidationError };
            }

            if (errors.Count > 0)
                return BadRequest(new { errors });

            course.Title = title;
            course.Credits = credits;
            course.DepartmentID = departmentId;

            // Handle file replacement
            if (file != null && file.Length > 0)
            {
                // Delete old file if exists
                DeleteFileFromDisk(course.TeachingMaterialImagePath);

                // Save new file
                course.TeachingMaterialImagePath = await SaveFileAsync(file);
            }

            await _db.SaveChangesAsync();

            _notificationService.SendNotification(
                "Course",
                course.CourseID.ToString(),
                course.Title,
                EntityOperation.UPDATE,
                "System");

            var dto = new CourseDto(
                course.CourseID,
                course.Title,
                course.Credits,
                course.DepartmentID,
                department?.Name ?? "",
                course.TeachingMaterialImagePath);

            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _db.Courses.FindAsync(id);
            if (course == null)
                return NotFound();

            var title = course.Title;

            // Delete associated file from disk
            DeleteFileFromDisk(course.TeachingMaterialImagePath);

            _db.Courses.Remove(course);
            await _db.SaveChangesAsync();

            _notificationService.SendNotification(
                "Course",
                id.ToString(),
                title,
                EntityOperation.DELETE,
                "System");

            return NoContent();
        }

        private string ValidateFile(IFormFile file)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                return "Allowed types: jpg, jpeg, png, gif, bmp";

            if (file.Length > MaxFileSize)
                return "Maximum file size is 5 MB";

            return null;
        }

        private async Task<string> SaveFileAsync(IFormFile file)
        {
            var uploadsPath = Path.Combine(_env.WebRootPath, "Uploads", "TeachingMaterials");
            if (!Directory.Exists(uploadsPath))
                Directory.CreateDirectory(uploadsPath);

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/Uploads/TeachingMaterials/{fileName}";
        }

        private void DeleteFileFromDisk(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath))
                return;

            var fullPath = Path.Combine(_env.WebRootPath, relativePath.TrimStart('/'));
            if (System.IO.File.Exists(fullPath))
            {
                try
                {
                    System.IO.File.Delete(fullPath);
                }
                catch
                {
                    // Log but don't fail the operation
                }
            }
        }
    }
}
