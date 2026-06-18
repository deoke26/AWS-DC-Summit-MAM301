using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ContosoUniversity.Data;
using ContosoUniversity.Services;
using ContosoUniversity.Models;
using Microsoft.AspNetCore.Mvc;


namespace ContosoUniversity.Controllers
{
    public class NotificationsController : BaseController
    {
        public NotificationsController(SchoolContext context, INotificationClient notificationClient) : base(context, notificationClient)
        {
        }

        // GET: api/notifications - Get pending notifications for admin
        [HttpGet]
        public async Task<JsonResult> GetNotifications()
        {
            try
            {
                var notifications = await _notificationClient.GetNotificationsAsync();
                return Json(new { 
                    success = true, 
                    notifications = notifications,
                    count = notifications.Count 
                });
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error retrieving notifications: {ex.Message}");
                return Json(new { success = false, message = "Error retrieving notifications" });
            }
        }

        // POST: api/notifications/mark-read
        [HttpPost]
        public async Task<JsonResult> MarkAsRead(int id)
        {
            try
            {
                await _notificationClient.MarkAsReadAsync(id);
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error marking notification as read: {ex.Message}");
                return Json(new { success = false, message = "Error updating notification" });
            }
        }

        // GET: Notifications/Index - Admin notification dashboard
        public ActionResult Index()
        {
            return View();
        }
    }
}
