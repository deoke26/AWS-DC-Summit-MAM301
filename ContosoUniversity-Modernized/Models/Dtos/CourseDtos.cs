using System;
using System.Collections.Generic;

namespace ContosoUniversity.Models.Dtos
{
    public record CourseDto(int CourseId, string Title, int Credits, int DepartmentId, string DepartmentName);
    public record CourseDetailDto(int CourseId, string Title, int Credits, int DepartmentId, string DepartmentName, List<string> Instructors);
    public record CreateCourseRequest(int CourseId, string Title, int Credits, int DepartmentId);
    public record UpdateCourseRequest(string Title, int Credits, int DepartmentId);
}
