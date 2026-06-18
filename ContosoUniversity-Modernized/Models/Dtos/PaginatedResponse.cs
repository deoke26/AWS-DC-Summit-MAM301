using System.Collections.Generic;

namespace ContosoUniversity.Models.Dtos
{
    public class PaginatedResponse<T>
    {
        public List<T> Items { get; set; }
        public int PageIndex { get; set; }
        public int TotalPages { get; set; }
        public int TotalCount { get; set; }
        public bool HasPreviousPage { get; set; }
        public bool HasNextPage { get; set; }

        public PaginatedResponse() { }

        public PaginatedResponse(List<T> items, int totalCount, int pageIndex, int pageSize)
        {
            Items = items;
            TotalCount = totalCount;
            PageIndex = pageIndex;
            TotalPages = totalCount > 0 ? (int)System.Math.Ceiling(totalCount / (double)pageSize) : 0;
            HasPreviousPage = pageIndex > 1;
            HasNextPage = pageIndex < TotalPages;
        }
    }
}
