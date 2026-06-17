using System;

namespace ContosoUniversity.Models.Dtos
{
    public record EnrollmentStatsDto(DateTime EnrollmentDate, int StudentCount);
}
