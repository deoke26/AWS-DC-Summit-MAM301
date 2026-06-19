using System.Collections.Generic;
using System.Threading.Tasks;
using ContosoUniversity.Models;

namespace ContosoUniversity.Services
{
    public interface INotificationClient
    {
        Task SendNotificationAsync(Notification notification);
        Task<List<Notification>> GetNotificationsAsync();
        Task MarkAsReadAsync(int id);
    }
}
