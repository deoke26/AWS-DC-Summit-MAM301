using Microsoft.AspNetCore.Mvc;
using NotificationService.API.Models;
using NotificationService.API.Services;

namespace NotificationService.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : ControllerBase
    {
        private static readonly string[] ValidOperations = { "CREATE", "UPDATE", "DELETE" };
        private readonly ISqsNotificationService _notificationService;

        public NotificationsController(ISqsNotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpPost]
        public async Task<IActionResult> SendNotification([FromBody] SendNotificationRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Missing or invalid required fields." });
            }

            if (!ValidOperations.Contains(request.Operation))
            {
                return BadRequest(new { success = false, message = "Operation must be one of: CREATE, UPDATE, DELETE" });
            }

            try
            {
                var notification = new Notification
                {
                    EntityType = request.EntityType,
                    EntityId = request.EntityId,
                    Operation = request.Operation,
                    Message = request.Message,
                    CreatedAt = request.CreatedAt,
                    CreatedBy = request.CreatedBy,
                    IsRead = false
                };

                var messageId = await _notificationService.SendNotificationAsync(notification);
                return Ok(new { success = true, messageId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            try
            {
                var notifications = await _notificationService.ReceiveNotificationsAsync();
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id}/mark-as-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            await _notificationService.MarkAsReadAsync(id);
            return Ok(new { success = true });
        }
    }
}
