using NotificationService.API.Models;

namespace NotificationService.API.Services
{
    public interface ISqsNotificationService
    {
        Task<string> SendNotificationAsync(Notification notification);
        Task<List<Notification>> ReceiveNotificationsAsync();
        Task MarkAsReadAsync(int id);
    }
}
