using System;

namespace NotificationService.API.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public string EntityType { get; set; }
        public string EntityId { get; set; }
        public string Operation { get; set; } // "CREATE", "UPDATE", "DELETE"
        public string Message { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; }
        public bool IsRead { get; set; }
    }
}
