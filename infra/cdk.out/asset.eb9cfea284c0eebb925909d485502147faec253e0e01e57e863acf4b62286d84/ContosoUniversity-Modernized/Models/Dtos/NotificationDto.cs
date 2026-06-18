using System;

namespace ContosoUniversity.Models.Dtos
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public string EntityType { get; set; }
        public string EntityId { get; set; }
        public string Operation { get; set; }
        public string Message { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; }
        public bool IsRead { get; set; }

        public NotificationDto() { }

        public NotificationDto(int id, string entityType, string entityId, string operation, string message, DateTime createdAt, string createdBy, bool isRead)
        {
            Id = id;
            EntityType = entityType;
            EntityId = entityId;
            Operation = operation;
            Message = message;
            CreatedAt = createdAt;
            CreatedBy = createdBy;
            IsRead = isRead;
        }
    }
}
