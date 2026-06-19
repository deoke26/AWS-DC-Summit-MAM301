using System;
using Amazon.SQS;
using Amazon.SQS.Model;
using ContosoUniversity.Models;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace ContosoUniversity.Services
{
    public class SqsNotificationService : INotificationService
    {
        private readonly IAmazonSQS _sqsClient;
        private readonly string _queueUrl;

        public SqsNotificationService(IAmazonSQS sqsClient, IConfiguration configuration)
        {
            _sqsClient = sqsClient;
            _queueUrl = configuration["AWS:SQS:QueueUrl"];
        }

        public void SendNotification(string entityType, string entityId, EntityOperation operation, string userName = null)
        {
            SendNotification(entityType, entityId, null, operation, userName);
        }

        public void SendNotification(string entityType, string entityId, string entityDisplayName, EntityOperation operation, string userName = null)
        {
            var notification = new Notification
            {
                EntityType = entityType,
                EntityId = entityId,
                Operation = operation.ToString(),
                Message = GenerateMessage(entityType, entityId, entityDisplayName, operation),
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userName ?? "System",
                IsRead = false
            };

            var messageBody = JsonConvert.SerializeObject(notification);

            var request = new SendMessageRequest
            {
                QueueUrl = _queueUrl,
                MessageBody = messageBody
            };

            _sqsClient.SendMessageAsync(request).GetAwaiter().GetResult();
        }

        public Notification ReceiveNotification()
        {
            var request = new ReceiveMessageRequest
            {
                QueueUrl = _queueUrl,
                MaxNumberOfMessages = 1,
                WaitTimeSeconds = 0
            };

            var response = _sqsClient.ReceiveMessageAsync(request).GetAwaiter().GetResult();

            if (response.Messages == null || response.Messages.Count == 0)
            {
                return null;
            }

            var message = response.Messages[0];
            var notification = JsonConvert.DeserializeObject<Notification>(message.Body);

            var deleteRequest = new DeleteMessageRequest
            {
                QueueUrl = _queueUrl,
                ReceiptHandle = message.ReceiptHandle
            };

            _sqsClient.DeleteMessageAsync(deleteRequest).GetAwaiter().GetResult();

            return notification;
        }

        public void MarkAsRead(int notificationId)
        {
            // No-op: SQS messages are deleted on receive; read tracking not applicable
        }

        public void Dispose()
        {
            // No-op: SQS client lifecycle is managed by the DI container
        }

        private string GenerateMessage(string entityType, string entityId, string entityDisplayName, EntityOperation operation)
        {
            var displayText = !string.IsNullOrWhiteSpace(entityDisplayName)
                ? $"{entityType} '{entityDisplayName}'"
                : $"{entityType} (ID: {entityId})";

            switch (operation)
            {
                case EntityOperation.CREATE:
                    return $"New {displayText} has been created";
                case EntityOperation.UPDATE:
                    return $"{displayText} has been updated";
                case EntityOperation.DELETE:
                    return $"{displayText} has been deleted";
                default:
                    return $"{displayText} operation: {operation}";
            }
        }
    }
}
