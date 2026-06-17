using System;
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
    [Route("api/students")]
    public class StudentsApiController : ControllerBase
    {
        private readonly SchoolContext _db;
        private readonly INotificationService _notificationService;

        public StudentsApiController(SchoolContext db, INotificationService notificationService)
        {
            _db = db;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResult<StudentDto>>> GetStudents(
            string sortOrder = "",
            string searchString = "",
            int page = 1,
            int pageSize = 10)
        {
            var query = _db.Students.AsQueryable();

            if (!string.IsNullOrEmpty(searchString))
            {
                query = query.Where(s =>
                    s.LastName.Contains(searchString) ||
                    s.FirstMidName.Contains(searchString));
            }

            query = sortOrder switch
            {
                "name_desc" => query.OrderByDescending(s => s.LastName),
                "Date" => query.OrderBy(s => s.EnrollmentDate),
                "date_desc" => query.OrderByDescending(s => s.EnrollmentDate),
                _ => query.OrderBy(s => s.LastName)
            };

            var totalCount = await query.CountAsync();

            var students = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new StudentDto(s.ID, s.LastName, s.FirstMidName, s.EnrollmentDate))
                .ToListAsync();

            return Ok(new PaginatedResult<StudentDto>(students, totalCount, page, pageSize));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StudentDetailDto>> GetStudent(int id)
        {
            var student = await _db.Students
                .Include(s => s.Enrollments)
                    .ThenInclude(e => e.Course)
                .FirstOrDefaultAsync(s => s.ID == id);

            if (student == null)
                return NotFound();

            var enrollments = student.Enrollments.Select(e => new EnrollmentDto(
                e.EnrollmentID,
                e.CourseID,
                e.Course.Title,
                e.Grade.HasValue ? e.Grade.Value.ToString() : "No grade"
            )).ToList();

            var dto = new StudentDetailDto(
                student.ID,
                student.LastName,
                student.FirstMidName,
                student.EnrollmentDate,
                enrollments);

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<StudentDto>> CreateStudent(CreateStudentRequest request)
        {
            var student = new Student
            {
                LastName = request.LastName,
                FirstMidName = request.FirstMidName,
                EnrollmentDate = request.EnrollmentDate
            };

            _db.Students.Add(student);
            await _db.SaveChangesAsync();

            _notificationService.SendNotification(
                "Student",
                student.ID.ToString(),
                $"{student.LastName}, {student.FirstMidName}",
                EntityOperation.CREATE,
                "System");

            var dto = new StudentDto(student.ID, student.LastName, student.FirstMidName, student.EnrollmentDate);
            return CreatedAtAction(nameof(GetStudent), new { id = student.ID }, dto);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<StudentDto>> UpdateStudent(int id, UpdateStudentRequest request)
        {
            var student = await _db.Students.FindAsync(id);
            if (student == null)
                return NotFound();

            student.LastName = request.LastName;
            student.FirstMidName = request.FirstMidName;
            student.EnrollmentDate = request.EnrollmentDate;

            await _db.SaveChangesAsync();

            _notificationService.SendNotification(
                "Student",
                student.ID.ToString(),
                $"{student.LastName}, {student.FirstMidName}",
                EntityOperation.UPDATE,
                "System");

            var dto = new StudentDto(student.ID, student.LastName, student.FirstMidName, student.EnrollmentDate);
            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            var student = await _db.Students.FindAsync(id);
            if (student == null)
                return NotFound();

            var displayName = $"{student.LastName}, {student.FirstMidName}";

            _db.Students.Remove(student);
            await _db.SaveChangesAsync();

            _notificationService.SendNotification(
                "Student",
                id.ToString(),
                displayName,
                EntityOperation.DELETE,
                "System");

            return NoContent();
        }
    }
}
