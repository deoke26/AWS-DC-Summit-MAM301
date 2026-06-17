using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ContosoUniversity.Data;
using ContosoUniversity.Models.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Controllers.Api
{
    [ApiController]
    [Route("api/stats")]
    public class StatsApiController : ControllerBase
    {
        private readonly SchoolContext _db;

        public StatsApiController(SchoolContext db)
        {
            _db = db;
        }

        [HttpGet("enrollments")]
        public async Task<ActionResult<List<EnrollmentStatsDto>>> GetEnrollmentStats()
        {
            var stats = await _db.Students
                .GroupBy(s => s.EnrollmentDate)
                .Select(g => new EnrollmentStatsDto(g.Key, g.Count()))
                .ToListAsync();

            return Ok(stats);
        }
    }
}
