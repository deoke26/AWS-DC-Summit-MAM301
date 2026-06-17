using System;
using System.Collections.Generic;

namespace ContosoUniversity.Models.Dtos
{
    public record InstructorDto(int Id, string LastName, string FirstMidName, DateTime HireDate, string OfficeLocation, List<string> Courses);
    public record InstructorDetailDto(int Id, string LastName, string FirstMidName, DateTime HireDate, string OfficeLocation, List<CourseDto> Courses);
    public record CreateInstructorRequest(string LastName, string FirstMidName, DateTime HireDate, string OfficeLocation, List<int> CourseIds);
    public record UpdateInstructorRequest(string LastName, string FirstMidName, DateTime HireDate, string OfficeLocation, List<int> CourseIds);
}
