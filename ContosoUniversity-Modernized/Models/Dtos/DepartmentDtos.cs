using System;
using System.ComponentModel.DataAnnotations;

namespace ContosoUniversity.Models.Dtos
{
    public class DepartmentDto
    {
        public int DepartmentId { get; set; }
        public string Name { get; set; }
        public decimal Budget { get; set; }
        public DateTime StartDate { get; set; }
        public int? InstructorId { get; set; }
        public string AdministratorName { get; set; }
        public uint RowVersion { get; set; }

        public DepartmentDto() { }

        public DepartmentDto(int departmentId, string name, decimal budget, DateTime startDate, int? instructorId, string administratorName, uint rowVersion)
        {
            DepartmentId = departmentId;
            Name = name;
            Budget = budget;
            StartDate = startDate;
            InstructorId = instructorId;
            AdministratorName = administratorName;
            RowVersion = rowVersion;
        }
    }

    public class CreateDepartmentRequest
    {
        [Required, StringLength(50, MinimumLength = 3)]
        public string Name { get; set; }

        [Range(0, 999999999.99)]
        public decimal Budget { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        public int? InstructorId { get; set; }

        public CreateDepartmentRequest() { }

        public CreateDepartmentRequest(string name, decimal budget, DateTime startDate, int? instructorId)
        {
            Name = name;
            Budget = budget;
            StartDate = startDate;
            InstructorId = instructorId;
        }
    }

    public class UpdateDepartmentRequest : CreateDepartmentRequest
    {
        [Required]
        public uint RowVersion { get; set; }

        public UpdateDepartmentRequest() { }

        public UpdateDepartmentRequest(string name, decimal budget, DateTime startDate, int? instructorId, uint rowVersion)
            : base(name, budget, startDate, instructorId)
        {
            RowVersion = rowVersion;
        }
    }
}
