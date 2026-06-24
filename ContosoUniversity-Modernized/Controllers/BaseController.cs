using System;
using ContosoUniversity.Services;
using ContosoUniversity.Models;
using ContosoUniversity.Data;
using Microsoft.AspNetCore.Mvc;


namespace ContosoUniversity.Controllers
{
    public abstract class BaseController : Controller
    {
        protected SchoolContext db;
        protected readonly INotificationClient _notificationClient;

        public BaseController(SchoolContext context, INotificationClient notificationClient)
        {
            db = context;
            _notificationClient = notificationClient;
        }

        protected void SendEntityNotification(string entityType, string entityId, EntityOperation operation)
        {
            SendEntityNotification(entityType, entityId, null, operation);
        }

        protected void SendEntityNotification(string entityType, string entityId, string entityDisplayName, EntityOperation operation)
        {
            try
            {
                var userName = "System"; // No authentication, use System as default user
                var displayPart = string.IsNullOrEmpty(entityDisplayName) ? entityId : entityDisplayName;
                var message = $"{entityType} {displayPart} was {operation.ToString().ToLower()}d";

                var notification = new Notification
                {
                    EntityType = entityType,
                    EntityId = entityId,
                    Operation = operation.ToString(),
                    Message = message,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userName,
                    IsRead = false
                };

                // Fire-and-forget: don't await the async call
                _ = _notificationClient.SendNotificationAsync(notification);
            }
            catch (Exception ex)
            {
                // Log the error but don't break the main operation
                System.Diagnostics.Debug.WriteLine($"Failed to send notification: {ex.Message}");
            }
        }
    }
}
