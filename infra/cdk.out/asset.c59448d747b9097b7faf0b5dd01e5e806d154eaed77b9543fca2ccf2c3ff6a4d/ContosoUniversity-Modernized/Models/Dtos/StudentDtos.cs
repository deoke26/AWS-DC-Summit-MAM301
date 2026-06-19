using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ContosoUniversity.Models.Dtos
{
    public class StudentDto
    {
        public int Id { get; set; }
        public string LastName { get; set; }
        public string FirstMidName { get; set; }
        public DateTime EnrollmentDate { get; set; }

        public StudentDto() { }

        public StudentDto(int id, string lastName, string firstMidName, DateTime enrollmentDate)
        {
            Id = id;
            LastName = lastName;
            FirstMidName = firstMidName;
            EnrollmentDate = enrollmentDate;
        }
    }

    public class StudentDetailDto : StudentDto
    {
        public List<EnrollmentDto> Enrollments { get; set; }

        public StudentDetailDto() { }

        public StudentDetailDto(int id, string lastName, string firstMidName, DateTime enrollmentDate, List<EnrollmentDto> enrollments)
            : base(id, lastName, firstMidName, enrollmentDate)
        {
            Enrollments = enrollments;
        }
    }

    public class EnrollmentDto
    {
        public string CourseName { get; set; }
        public string Grade { get; set; }

        public EnrollmentDto() { }

        public EnrollmentDto(string courseName, string grade)
        {
            CourseName = courseName;
            Grade = grade;
        }
    }

    public class CreateStudentRequest
    {
        [Required, StringLength(50)]
        public string LastName { get; set; }

        [Required, StringLength(50)]
        public string FirstMidName { get; set; }

        [Required]
        public DateTime EnrollmentDate { get; set; }

        public CreateStudentRequest() { }

        public CreateStudentRequest(string lastName, string firstMidName, DateTime enrollmentDate)
        {
            LastName = lastName;
            FirstMidName = firstMidName;
            EnrollmentDate = enrollmentDate;
        }
    }

    public class UpdateStudentRequest : CreateStudentRequest
    {
        public int Id { get; set; }

        public UpdateStudentRequest() { }

        public UpdateStudentRequest(string lastName, string firstMidName, DateTime enrollmentDate)
            : base(lastName, firstMidName, enrollmentDate)
        {
        }
    }
}
