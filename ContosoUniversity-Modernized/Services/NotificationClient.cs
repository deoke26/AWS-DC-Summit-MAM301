using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using ContosoUniversity.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace ContosoUniversity.Services
{
    public class NotificationClient : INotificationClient
    {
        private readonly HttpClient _httpClient;
        private static readonly JsonSerializerSettings _jsonSettings = new JsonSerializerSettings
        {
            Converters = { new StringEnumConverter() }
        };

        public NotificationClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task SendNotificationAsync(Notification notification)
        {
            try
            {
                var json = JsonConvert.SerializeObject(notification, _jsonSettings);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                await _httpClient.PostAsync("/api/notifications", content);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Failed to send notification: {ex.Message}");
            }
        }

        public async Task<List<Notification>> GetNotificationsAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("/api/notifications");
                if (!response.IsSuccessStatusCode)
                {
                    Debug.WriteLine($"Failed to get notifications: HTTP {(int)response.StatusCode}");
                    return new List<Notification>();
                }

                var json = await response.Content.ReadAsStringAsync();
                var notifications = JsonConvert.DeserializeObject<List<Notification>>(json, _jsonSettings);
                return notifications ?? new List<Notification>();
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Failed to get notifications: {ex.Message}");
                return new List<Notification>();
            }
        }

        public async Task MarkAsReadAsync(int id)
        {
            try
            {
                await _httpClient.PostAsync($"/api/notifications/{id}/mark-as-read", new StringContent(string.Empty));
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Failed to mark notification as read: {ex.Message}");
            }
        }
    }
}
