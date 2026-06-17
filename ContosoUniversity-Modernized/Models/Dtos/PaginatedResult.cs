using System.Collections.Generic;

namespace ContosoUniversity.Models.Dtos
{
    public record PaginatedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize);
}
