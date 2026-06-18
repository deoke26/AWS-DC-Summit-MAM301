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
    [Route("api/instructors")]
    public class InstructorsApiController : ControllerBase
    {
        private readonly SchoolContext _db;
        private readonly INotificationService _notificationService;

        public InstructorsApiController(SchoolContext db, INotificationService notificationService)
        {
            _db = db;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<ActionResult<List<InstructorDto>>> GetInstructors()
        {
            var instructors = await _db.Instructors
                .Include(i => i.OfficeAssignment)
                .Include(i => i.CourseAssignments)
                .OrderBy(i => i.LastName)
                .ToListAsync();

            var dtos = instructors.Select(i => new InstructorDto(
                i.ID,
                i.LastName,
                i.FirstMidName,
                i.HireDate,
                i.OfficeAssignment?.Location ?? "",
                i.CourseAssignments.Select(ca => ca.CourseID).ToArray()
            )).ToList();

            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InstructorDetailDto>> GetInstructor(int id)
        {
            var instructor = await _db.Instructors
                .Include(i => i.OfficeAssignment)
                .Include(i => i.CourseAssignments)
                    .ThenInclude(ca => ca.Course)
                        .ThenInclude(c => c.Department)
                .Include(i => i.CourseAssignments)
                    .ThenInclude(ca => ca.Course)
                        .ThenInclude(c => c.Enrollments)
                            .ThenInclude(e => e.Student)
                .FirstOrDefaultAsync(i => i.ID == id);

            if (instructor == null)
                return NotFound();

            var courses = instructor.CourseAssignments.Select(ca => new CourseWithEnrollmentsDto(
                ca.Course.CourseID,
                ca.Course.Title,
                ca.Course.Department?.Name ?? "",
                ca.Course.Enrollments?.Select(e => new EnrollmentDto(
                    e.Student != null ? $"{e.Student.LastName}, {e.Student.FirstMidName}" : "",
                    e.Grade.HasValue ? e.Grade.Value.ToString() : null
                )).ToList() ?? new List<EnrollmentDto>()
            )).ToList();

            var assignedCourseIds = instructor.CourseAssignments.Select(ca => ca.CourseID).ToArray();

            var dto = new InstructorDetailDto(
                instructor.ID,
                instructor.LastName,
                instructor.FirstMidName,
                instructor.HireDate,
                instructor.OfficeAssignment?.Location ?? "",
                assignedCourseIds,
                courses);

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<InstructorDto>> CreateInstructor(CreateInstructorRequest request)
        {
            var instructor = new Instructor
            {
                LastName = request.LastName,
                FirstMidName = request.FirstMidName,
                HireDate = request.HireDate
            };

            if (!string.IsNullOrEmpty(request.OfficeLocation))
            {
                instructor.OfficeAssignment = new OfficeAssignment
                {
                    Location = request.OfficeLocation
                };
            }

            _db.Instructors.Add(instructor);
            await _db.SaveChangesAsync();

            if (request.CourseIds != null && request.CourseIds.Any())
            {
                foreach (var courseId in request.CourseIds)
                {
                    _db.CourseAssignments.Add(new CourseAssignment
                    {
                        CourseID = courseId,
                        InstructorID = instructor.ID
                    });
                }
                await _db.SaveChangesAsync();
            }

            _notificationService.SendNotification(
                "Instructor",
                instructor.ID.ToString(),
                $"{instructor.LastName}, {instructor.FirstMidName}",
                EntityOperation.CREATE,
                "System");

            var dto = new InstructorDto(
                instructor.ID,
                instructor.LastName,
                instructor.FirstMidName,
                instructor.HireDate,
                request.OfficeLocation ?? "",
                request.CourseIds ?? Array.Empty<int>());

            return CreatedAtAction(nameof(GetInstructor), new { id = instructor.ID }, dto);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<InstructorDto>> UpdateInstructor(int id, UpdateInstructorRequest request)
        {
            var instructor = await _db.Instructors
                .Include(i => i.OfficeAssignment)
                .Include(i => i.CourseAssignments)
                .FirstOrDefaultAsync(i => i.ID == id);

            if (instructor == null)
                return NotFound();

            instructor.LastName = request.LastName;
            instructor.FirstMidName = request.FirstMidName;
            instructor.HireDate = request.HireDate;

            // Update office assignment
            if (string.IsNullOrEmpty(request.OfficeLocation))
            {
                if (instructor.OfficeAssignment != null)
                {
                    _db.OfficeAssignments.Remove(instructor.OfficeAssignment);
                }
            }
            else
            {
                if (instructor.OfficeAssignment == null)
                {
                    instructor.OfficeAssignment = new OfficeAssignment
                    {
                        InstructorID = instructor.ID,
                        Location = request.OfficeLocation
                    };
                }
                else
                {
                    instructor.OfficeAssignment.Location = request.OfficeLocation;
                }
            }

            // Sync course assignments: add new, remove omitted
            var currentCourseIds = instructor.CourseAssignments.Select(ca => ca.CourseID).ToList();
            var requestedCourseIds = request.CourseIds ?? Array.Empty<int>();

            var toRemove = instructor.CourseAssignments
                .Where(ca => !requestedCourseIds.Contains(ca.CourseID))
                .ToList();
            foreach (var ca in toRemove)
            {
                _db.CourseAssignments.Remove(ca);
            }

            var toAdd = requestedCourseIds.Where(cid => !currentCourseIds.Contains(cid));
            foreach (var courseId in toAdd)
            {
                _db.CourseAssignments.Add(new CourseAssignment
                {
                    CourseID = courseId,
                    InstructorID = instructor.ID
                });
            }

            await _db.SaveChangesAsync();

            _notificationService.SendNotification(
                "Instructor",
                instructor.ID.ToString(),
                $"{instructor.LastName}, {instructor.FirstMidName}",
                EntityOperation.UPDATE,
                "System");

            var dto = new InstructorDto(
                instructor.ID,
                instructor.LastName,
                instructor.FirstMidName,
                instructor.HireDate,
                request.OfficeLocation ?? "",
                requestedCourseIds);

            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInstructor(int id)
        {
            var instructor = await _db.Instructors
                .Include(i => i.OfficeAssignment)
                .Include(i => i.CourseAssignments)
                .FirstOrDefaultAsync(i => i.ID == id);

            if (instructor == null)
                return NotFound();

            var displayName = $"{instructor.LastName}, {instructor.FirstMidName}";

            // Remove office assignment
            if (instructor.OfficeAssignment != null)
            {
                _db.OfficeAssignments.Remove(instructor.OfficeAssignment);
            }

            // Null-out department administrator references
            var departmentsAdministered = await _db.Departments
                .Where(d => d.InstructorID == id)
                .ToListAsync();
            foreach (var dept in departmentsAdministered)
            {
                dept.InstructorID = null;
            }

            // Remove course assignments
            _db.CourseAssignments.RemoveRange(instructor.CourseAssignments);

            _db.Instructors.Remove(instructor);
            await _db.SaveChangesAsync();

            _notificationService.SendNotification(
                "Instructor",
                id.ToString(),
                displayName,
                EntityOperation.DELETE,
                "System");

            return NoContent();
        }
    }
}
