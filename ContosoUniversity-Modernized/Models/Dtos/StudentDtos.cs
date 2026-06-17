using System;
using System.Collections.Generic;

namespace ContosoUniversity.Models.Dtos
{
    public record StudentDto(int Id, string LastName, string FirstMidName, DateTime EnrollmentDate);
    public record StudentDetailDto(int Id, string LastName, string FirstMidName, DateTime EnrollmentDate, List<EnrollmentDto> Enrollments);
    public record EnrollmentDto(int EnrollmentId, int CourseId, string CourseTitle, string Grade);
    public record CreateStudentRequest(string LastName, string FirstMidName, DateTime EnrollmentDate);
    public record UpdateStudentRequest(string LastName, string FirstMidName, DateTime EnrollmentDate);
}
