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
    [Route("api/departments")]
    public class DepartmentsApiController : ControllerBase
    {
        private readonly SchoolContext _db;
        private readonly INotificationService _notificationService;

        public DepartmentsApiController(SchoolContext db, INotificationService notificationService)
        {
            _db = db;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<ActionResult<List<DepartmentDto>>> GetDepartments()
        {
            var departments = await _db.Departments
                .Include(d => d.Administrator)
                .Select(d => new DepartmentDto(
                    d.DepartmentID,
                    d.Name,
                    d.Budget,
                    d.StartDate,
                    d.InstructorID,
                    d.Administrator != null
                        ? d.Administrator.LastName + ", " + d.Administrator.FirstMidName
                        : "",
                    d.RowVersion))
                .ToListAsync();

            return Ok(departments);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DepartmentDto>> GetDepartment(int id)
        {
            var department = await _db.Departments
                .Include(d => d.Administrator)
                .FirstOrDefaultAsync(d => d.DepartmentID == id);

            if (department == null)
                return NotFound();

            var dto = new DepartmentDto(
                department.DepartmentID,
                department.Name,
                department.Budget,
                department.StartDate,
                department.InstructorID,
                department.Administrator != null
                    ? $"{department.Administrator.LastName}, {department.Administrator.FirstMidName}"
                    : "",
                department.RowVersion);

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<DepartmentDto>> CreateDepartment(CreateDepartmentRequest request)
        {
            if (request.InstructorId.HasValue)
            {
                var instructorExists = await _db.Instructors.AnyAsync(i => i.ID == request.InstructorId.Value);
                if (!instructorExists)
                {
                    ModelState.AddModelError("InstructorId", "The specified instructor does not exist.");
                    return ValidationProblem();
                }
            }

            var department = new Department
            {
                Name = request.Name,
                Budget = request.Budget,
                StartDate = request.StartDate,
                InstructorID = request.InstructorId
            };

            _db.Departments.Add(department);
            await _db.SaveChangesAsync();

            _notificationService.SendNotification(
                "Department",
                department.DepartmentID.ToString(),
                department.Name,
                EntityOperation.CREATE,
                "System");

            string adminName = "";
            if (department.InstructorID.HasValue)
            {
                var admin = await _db.Instructors.FindAsync(department.InstructorID.Value);
                if (admin != null)
                    adminName = $"{admin.LastName}, {admin.FirstMidName}";
            }

            var dto = new DepartmentDto(
                department.DepartmentID,
                department.Name,
                department.Budget,
                department.StartDate,
                department.InstructorID,
                adminName,
                department.RowVersion);

            return CreatedAtAction(nameof(GetDepartment), new { id = department.DepartmentID }, dto);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<DepartmentDto>> UpdateDepartment(int id, UpdateDepartmentRequest request)
        {
            if (request.InstructorId.HasValue)
            {
                var instructorExists = await _db.Instructors.AnyAsync(i => i.ID == request.InstructorId.Value);
                if (!instructorExists)
                {
                    ModelState.AddModelError("InstructorId", "The specified instructor does not exist.");
                    return ValidationProblem();
                }
            }

            var department = await _db.Departments
                .Include(d => d.Administrator)
                .FirstOrDefaultAsync(d => d.DepartmentID == id);

            if (department == null)
                return NotFound();

            // Set the original RowVersion for EF Core concurrency check
            _db.Entry(department).Property(d => d.RowVersion).OriginalValue = request.RowVersion;

            department.Name = request.Name;
            department.Budget = request.Budget;
            department.StartDate = request.StartDate;
            department.InstructorID = request.InstructorId;

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                // Reload the current database values
                var currentDepartment = await _db.Departments
                    .Include(d => d.Administrator)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.DepartmentID == id);

                if (currentDepartment == null)
                    return NotFound();

                var currentAdminName = currentDepartment.Administrator != null
                    ? $"{currentDepartment.Administrator.LastName}, {currentDepartment.Administrator.FirstMidName}"
                    : "";

                return Conflict(new
                {
                    message = "The department has been modified by another user. Please review the current values and try again.",
                    currentValues = new DepartmentDto(
                        currentDepartment.DepartmentID,
                        currentDepartment.Name,
                        currentDepartment.Budget,
                        currentDepartment.StartDate,
                        currentDepartment.InstructorID,
                        currentAdminName,
                        currentDepartment.RowVersion)
                });
            }

            _notificationService.SendNotification(
                "Department",
                department.DepartmentID.ToString(),
                department.Name,
                EntityOperation.UPDATE,
                "System");

            string adminName = "";
            if (department.InstructorID.HasValue)
            {
                var admin = await _db.Instructors.FindAsync(department.InstructorID.Value);
                if (admin != null)
                    adminName = $"{admin.LastName}, {admin.FirstMidName}";
            }

            var dto = new DepartmentDto(
                department.DepartmentID,
                department.Name,
                department.Budget,
                department.StartDate,
                department.InstructorID,
                adminName,
                department.RowVersion);

            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var department = await _db.Departments.FindAsync(id);
            if (department == null)
                return NotFound();

            var name = department.Name;

            _db.Departments.Remove(department);
            await _db.SaveChangesAsync();

            _notificationService.SendNotification(
                "Department",
                id.ToString(),
                name,
                EntityOperation.DELETE,
                "System");

            return NoContent();
        }
    }
}
