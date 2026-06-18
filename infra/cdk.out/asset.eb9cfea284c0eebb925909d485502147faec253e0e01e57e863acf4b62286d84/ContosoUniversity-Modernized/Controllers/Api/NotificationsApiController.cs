using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ContosoUniversity.Data;
using ContosoUniversity.Models;
using ContosoUniversity.Models.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContosoUniversity.Controllers.Api
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsApiController : ControllerBase
    {
        private readonly SchoolContext _db;

        public NotificationsApiController(SchoolContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<List<NotificationDto>>> GetNotifications()
        {
            var notifications = await _db.Notifications
                .Where(n => !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .Take(10)
                .Select(n => new NotificationDto(
                    n.Id,
                    n.EntityType,
                    n.EntityId,
                    n.Operation,
                    n.Message,
                    n.CreatedAt,
                    n.CreatedBy,
                    n.IsRead))
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpPost("{id}/mark-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new { error = "ID must be a valid positive integer." });
            }

            var notification = await _db.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound(new { error = "Notification not found." });
            }

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok();
        }
    }
}
