using System;
using System.ComponentModel.DataAnnotations;

namespace NotificationService.API.Models
{
    public class SendNotificationRequest
    {
        [Required]
        public string EntityType { get; set; }

        [Required]
        public string EntityId { get; set; }

        [Required]
        public string Operation { get; set; } // Must be "CREATE", "UPDATE", or "DELETE"

        [Required]
        public string Message { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        public string CreatedBy { get; set; }
    }
}
