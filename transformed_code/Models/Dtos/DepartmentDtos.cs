using System;

namespace ContosoUniversity.Models.Dtos
{
    public record DepartmentDto(int DepartmentId, string Name, decimal Budget, DateTime StartDate, int? InstructorId, string AdministratorName);
    public record CreateDepartmentRequest(string Name, decimal Budget, DateTime StartDate, int? InstructorId);
    public record UpdateDepartmentRequest(string Name, decimal Budget, DateTime StartDate, int? InstructorId, byte[] RowVersion);
}
