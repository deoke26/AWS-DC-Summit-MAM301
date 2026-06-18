using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ContosoUniversity.Models.Dtos
{
    public class CourseDto
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public int Credits { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; }
        public string TeachingMaterialImagePath { get; set; }

        public CourseDto() { }

        public CourseDto(int courseId, string title, int credits, int departmentId, string departmentName, string teachingMaterialImagePath = null)
        {
            CourseId = courseId;
            Title = title;
            Credits = credits;
            DepartmentId = departmentId;
            DepartmentName = departmentName;
            TeachingMaterialImagePath = teachingMaterialImagePath;
        }
    }

    public class CourseDetailDto
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public int Credits { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; }
        public List<string> Instructors { get; set; }

        public CourseDetailDto() { }

        public CourseDetailDto(int courseId, string title, int credits, int departmentId, string departmentName, List<string> instructors)
        {
            CourseId = courseId;
            Title = title;
            Credits = credits;
            DepartmentId = departmentId;
            DepartmentName = departmentName;
            Instructors = instructors;
        }
    }

    public class CreateCourseRequest
    {
        [Required]
        public int CourseId { get; set; }

        [Required, StringLength(50, MinimumLength = 3)]
        public string Title { get; set; }

        [Range(0, 5)]
        public int Credits { get; set; }

        [Required]
        public int DepartmentId { get; set; }

        public CreateCourseRequest() { }

        public CreateCourseRequest(int courseId, string title, int credits, int departmentId)
        {
            CourseId = courseId;
            Title = title;
            Credits = credits;
            DepartmentId = departmentId;
        }
    }

    public class UpdateCourseRequest
    {
        [Required, StringLength(50, MinimumLength = 3)]
        public string Title { get; set; }

        [Range(0, 5)]
        public int Credits { get; set; }

        [Required]
        public int DepartmentId { get; set; }

        public UpdateCourseRequest() { }

        public UpdateCourseRequest(string title, int credits, int departmentId)
        {
            Title = title;
            Credits = credits;
            DepartmentId = departmentId;
        }
    }
}
