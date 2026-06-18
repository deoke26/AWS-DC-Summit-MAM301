using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ContosoUniversity.Models.Dtos
{
    public class InstructorDto
    {
        public int Id { get; set; }
        public string LastName { get; set; }
        public string FirstMidName { get; set; }
        public DateTime HireDate { get; set; }
        public string OfficeLocation { get; set; }
        public int[] AssignedCourseIds { get; set; }

        public InstructorDto() { }

        public InstructorDto(int id, string lastName, string firstMidName, DateTime hireDate, string officeLocation, int[] assignedCourseIds)
        {
            Id = id;
            LastName = lastName;
            FirstMidName = firstMidName;
            HireDate = hireDate;
            OfficeLocation = officeLocation;
            AssignedCourseIds = assignedCourseIds;
        }
    }

    public class InstructorDetailDto : InstructorDto
    {
        public List<CourseWithEnrollmentsDto> Courses { get; set; }

        public InstructorDetailDto() { }

        public InstructorDetailDto(int id, string lastName, string firstMidName, DateTime hireDate, string officeLocation, int[] assignedCourseIds, List<CourseWithEnrollmentsDto> courses)
            : base(id, lastName, firstMidName, hireDate, officeLocation, assignedCourseIds)
        {
            Courses = courses;
        }
    }

    public class CourseWithEnrollmentsDto
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public string DepartmentName { get; set; }
        public List<EnrollmentDto> Enrollments { get; set; }

        public CourseWithEnrollmentsDto() { }

        public CourseWithEnrollmentsDto(int courseId, string title, string departmentName, List<EnrollmentDto> enrollments)
        {
            CourseId = courseId;
            Title = title;
            DepartmentName = departmentName;
            Enrollments = enrollments;
        }
    }

    public class CreateInstructorRequest
    {
        [Required, StringLength(50)]
        public string LastName { get; set; }

        [Required, StringLength(50)]
        public string FirstMidName { get; set; }

        [Required]
        public DateTime HireDate { get; set; }

        [StringLength(50)]
        public string OfficeLocation { get; set; }

        public int[] CourseIds { get; set; }

        public CreateInstructorRequest() { }

        public CreateInstructorRequest(string lastName, string firstMidName, DateTime hireDate, string officeLocation, int[] courseIds)
        {
            LastName = lastName;
            FirstMidName = firstMidName;
            HireDate = hireDate;
            OfficeLocation = officeLocation;
            CourseIds = courseIds;
        }

        // Backward-compatible constructor accepting List<int>
        public CreateInstructorRequest(string lastName, string firstMidName, DateTime hireDate, string officeLocation, List<int> courseIds)
        {
            LastName = lastName;
            FirstMidName = firstMidName;
            HireDate = hireDate;
            OfficeLocation = officeLocation;
            CourseIds = courseIds?.ToArray();
        }
    }

    public class UpdateInstructorRequest : CreateInstructorRequest
    {
        public UpdateInstructorRequest() { }

        public UpdateInstructorRequest(string lastName, string firstMidName, DateTime hireDate, string officeLocation, int[] courseIds)
            : base(lastName, firstMidName, hireDate, officeLocation, courseIds)
        {
        }

        public UpdateInstructorRequest(string lastName, string firstMidName, DateTime hireDate, string officeLocation, List<int> courseIds)
            : base(lastName, firstMidName, hireDate, officeLocation, courseIds)
        {
        }
    }
}
