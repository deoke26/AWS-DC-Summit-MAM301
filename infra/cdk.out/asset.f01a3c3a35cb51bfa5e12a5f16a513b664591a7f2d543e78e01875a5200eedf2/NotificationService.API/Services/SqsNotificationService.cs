using Amazon.SQS;
using Amazon.SQS.Model;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using NotificationService.API.Models;

namespace NotificationService.API.Services
{
    public class SqsNotificationService : ISqsNotificationService
    {
        private readonly IAmazonSQS _sqsClient;
        private readonly string _queueUrl;
        private readonly JsonSerializerSettings _jsonSettings;

        public SqsNotificationService(IAmazonSQS sqsClient, IConfiguration configuration)
        {
            _sqsClient = sqsClient;
            _queueUrl = configuration["AWS:SQS:QueueUrl"]
                ?? throw new InvalidOperationException("AWS:SQS:QueueUrl configuration is missing.");
            _jsonSettings = new JsonSerializerSettings
            {
                Converters = { new StringEnumConverter() }
            };
        }

        public async Task<string> SendNotificationAsync(Notification notification)
        {
            var messageBody = JsonConvert.SerializeObject(notification, _jsonSettings);

            var request = new SendMessageRequest
            {
                QueueUrl = _queueUrl,
                MessageBody = messageBody
            };

            var response = await _sqsClient.SendMessageAsync(request);
            return response.MessageId;
        }

        public async Task<List<Notification>> ReceiveNotificationsAsync()
        {
            var request = new ReceiveMessageRequest
            {
                QueueUrl = _queueUrl,
                MaxNumberOfMessages = 10,
                WaitTimeSeconds = 0
            };

            var response = await _sqsClient.ReceiveMessageAsync(request);
            var notifications = new List<Notification>();

            foreach (var message in response.Messages)
            {
                try
                {
                    var notification = JsonConvert.DeserializeObject<Notification>(message.Body, _jsonSettings);
                    if (notification != null)
                    {
                        notifications.Add(notification);
                    }
                }
                catch (JsonException)
                {
                    // Skip malformed messages
                }
                finally
                {
                    // Delete every message from the queue regardless of deserialization success
                    await _sqsClient.DeleteMessageAsync(new DeleteMessageRequest
                    {
                        QueueUrl = _queueUrl,
                        ReceiptHandle = message.ReceiptHandle
                    });
                }
            }

            return notifications;
        }

        public Task MarkAsReadAsync(int id)
        {
            // No-op: SQS messages are consumed on read, so mark-as-read is not applicable
            return Task.CompletedTask;
        }
    }
}
