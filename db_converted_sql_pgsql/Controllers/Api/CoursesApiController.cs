using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ContosoUniversity.Data;
using ContosoUniversity.Models;
using ContosoUniversity.Models.Dtos;
using ContosoUniversity.Services;
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

        public CoursesApiController(SchoolContext db, INotificationService notificationService)
        {
            _db = db;
            _notificationService = notificationService;
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
                    c.Department.Name))
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
        public async Task<ActionResult<CourseDto>> CreateCourse(CreateCourseRequest request)
        {
            var course = new Course
            {
                CourseID = request.CourseId,
                Title = request.Title,
                Credits = request.Credits,
                DepartmentID = request.DepartmentId
            };

            _db.Courses.Add(course);
            await _db.SaveChangesAsync();

            _notificationService.SendNotification(
                "Course",
                course.CourseID.ToString(),
                course.Title,
                EntityOperation.CREATE,
                "System");

            var department = await _db.Departments.FindAsync(course.DepartmentID);
            var dto = new CourseDto(course.CourseID, course.Title, course.Credits, course.DepartmentID, department?.Name ?? "");
            return CreatedAtAction(nameof(GetCourse), new { id = course.CourseID }, dto);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CourseDto>> UpdateCourse(int id, UpdateCourseRequest request)
        {
            var course = await _db.Courses.FindAsync(id);
            if (course == null)
                return NotFound();

            course.Title = request.Title;
            course.Credits = request.Credits;
            course.DepartmentID = request.DepartmentId;

            await _db.SaveChangesAsync();

            _notificationService.SendNotification(
                "Course",
                course.CourseID.ToString(),
                course.Title,
                EntityOperation.UPDATE,
                "System");

            var department = await _db.Departments.FindAsync(course.DepartmentID);
            var dto = new CourseDto(course.CourseID, course.Title, course.Credits, course.DepartmentID, department?.Name ?? "");
            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _db.Courses.FindAsync(id);
            if (course == null)
                return NotFound();

            var title = course.Title;

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
    }
}
