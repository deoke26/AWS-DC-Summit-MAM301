# Implementation Plan: Notification Service API

## Overview

Extract `NotificationService` from ContosoUniversity into a standalone `NotificationService.API` ASP.NET Core Web API (.NET 8) microservice, then refactor ContosoUniversity to call it over HTTP via a typed `INotificationClient` / `NotificationClient`. All six CRUD controllers keep their fire-and-forget notification behaviour unchanged. No Docker, no HTTPS, no auth, no health checks.

---

## Tasks

- [ ] 1. Create the NotificationService.API project and solution wiring
  - Add a new `NotificationService.API` ASP.NET Core Web API project (controller-based, .NET 8) at `/NotificationService.API/` in the repo root alongside `ContosoUniversity/`
  - Add the project to `ContosoUniversity.sln` so both projects are in the same solution
  - Add NuGet references to `AWSSDK.SQS` version `3.7.400.2` and `Newtonsoft.Json` version `13.0.3` with exact version pins in `NotificationService.API.csproj`
  - Create `Properties/launchSettings.json` with a single profile named `NotificationService.API` that configures Kestrel on HTTP port 5051 only (no HTTPS endpoint)
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [ ] 1.1 Scaffold NotificationService.API project structure
    - Create the project file `NotificationService.API/NotificationService.API.csproj` targeting `net8.0` with package refs for `AWSSDK.SQS` (3.7.400.2) and `Newtonsoft.Json` (13.0.3)
    - Add the project to `ContosoUniversity.sln` via `dotnet sln add`
    - Create folder skeleton: `Controllers/`, `Models/`, `Services/`, `Properties/`
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.2 Add launchSettings.json for HTTP-only port 5051
    - Write `NotificationService.API/Properties/launchSettings.json` with profile `NotificationService.API` setting `applicationUrl` to `http://localhost:5051` and no HTTPS url
    - _Requirements: 1.5_

- [ ] 2. Add shared models to NotificationService.API
  - [ ] 2.1 Copy Notification model and EntityOperation enum into API project
    - Create `NotificationService.API/Models/Notification.cs` with namespace `NotificationService.API.Models`, copying all properties, data-annotation attributes (`[Key]`, `[Required]`, `[StringLength(...)]`), and types exactly from `ContosoUniversity.Models.Notification`
    - Create `NotificationService.API/Models/EntityOperation.cs` with the same three enum members (`CREATE`, `UPDATE`, `DELETE`) under namespace `NotificationService.API.Models`
    - _Requirements: 1.4_

- [ ] 3. Implement SqsNotificationService in NotificationService.API
  - [ ] 3.1 Define ISqsNotificationService interface
    - Create `NotificationService.API/Services/ISqsNotificationService.cs` with methods: `Task SendNotificationAsync(Notification notification)`, `Task<List<Notification>> GetNotificationsAsync()`, `Task MarkAsReadAsync(int id)`
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 3.2 Implement SqsNotificationService
    - Create `NotificationService.API/Services/SqsNotificationService.cs` implementing `ISqsNotificationService`
    - Declare `private readonly AmazonSQSClient _sqsClient` constructed with `RegionEndpoint.USEast1`
    - Declare `private const string QueueUrl = "https://sqs.us-east-1.amazonaws.com/836548370410/contoso-notifications"`
    - `SendNotificationAsync`: serialize `Notification` using `JsonConvert.SerializeObject` with `StringEnumConverter` settings; call `_sqsClient.SendMessageAsync`; on exception log to `Debug.WriteLine` and rethrow (controller handles 500)
    - `GetNotificationsAsync`: call `ReceiveMessageAsync` with `MaxNumberOfMessages = 10` and `WaitTimeSeconds = 0`; for each message attempt `JsonConvert.DeserializeObject<Notification>` with `StringEnumConverter`; on deserialization failure log to `Debug.WriteLine` and note message for best-effort delete; call `DeleteMessageAsync` on every message (valid or malformed) in a try/catch that logs failures to `Debug.WriteLine` without propagating; return only successfully deserialized notifications
    - `MarkAsReadAsync`: no-op, return immediately
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 3.2, 3.6_

- [ ] 4. Implement NotificationsController in NotificationService.API
  - [ ] 4.1 Create NotificationsController with three action methods
    - Create `NotificationService.API/Controllers/NotificationsController.cs` with `[ApiController]` and `[Route("api/notifications")]`
    - Inject `ISqsNotificationService` via constructor
    - `POST /api/notifications` — `SendNotification([FromBody] Notification notification)`: validate that `notification` is non-null and that `EntityType`, `EntityId`, `Operation`, `Message`, `CreatedAt` are non-null/non-empty; return 400 on failure; call `_sqsService.SendNotificationAsync`; return 200 on success; return 500 with empty body if `SendNotificationAsync` throws
    - `GET /api/notifications` — `GetNotifications()`: call `_sqsService.GetNotificationsAsync()`; return 200 with the notification array (empty array when no messages); return 500 with empty body on exception
    - `POST /api/notifications/{id}/mark-as-read` — `MarkAsRead(int id)`: return 400 if `id < 1`; call `_sqsService.MarkAsReadAsync(id)`; return `{ "success": true }` with 200
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Configure Program.cs for NotificationService.API
  - [ ] 5.1 Wire up DI and Newtonsoft.Json in Program.cs
    - Create `NotificationService.API/Program.cs`
    - Call `builder.Services.AddControllers().AddNewtonsoftJson(opts => opts.SerializerSettings.Converters.Add(new StringEnumConverter()))` so all controller responses use Newtonsoft.Json with `StringEnumConverter`
    - Register `builder.Services.AddSingleton<ISqsNotificationService, SqsNotificationService>()` so a single `AmazonSQSClient` instance is reused
    - Call `app.MapControllers()` and `app.Run()`
    - _Requirements: 5.4_

- [ ] 6. Checkpoint — build NotificationService.API
  - Run `dotnet build` on the `NotificationService.API` project and ensure zero errors before proceeding to ContosoUniversity changes.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Add INotificationClient and NotificationClient to ContosoUniversity
  - [ ] 7.1 Define INotificationClient interface
    - Create `ContosoUniversity/Services/INotificationClient.cs` under namespace `ContosoUniversity.Services`
    - Declare three methods: `Task SendNotificationAsync(Notification notification)`, `Task<IEnumerable<Notification>> GetNotificationsAsync()`, `Task MarkAsReadAsync(int id)`
    - _Requirements: 6.1_

  - [ ] 7.2 Implement NotificationClient
    - Create `ContosoUniversity/Services/NotificationClient.cs` implementing `INotificationClient`
    - Declare `private const string BaseAddress = "http://localhost:5051"`
    - Constructor: `NotificationClient(HttpClient http, ILogger<NotificationClient> logger)`
    - `SendNotificationAsync`: serialize `Notification` with `JsonConvert.SerializeObject` + `StringEnumConverter`; POST to `/api/notifications` with `Content-Type: application/json`; on exception or non-2xx status log via `_logger` and return (do not rethrow)
    - `GetNotificationsAsync`: GET `/api/notifications`; on success deserialize response with `JsonConvert.DeserializeObject<List<Notification>>` + `StringEnumConverter`; on any exception or non-2xx status log via `_logger` and return `Enumerable.Empty<Notification>()`
    - `MarkAsReadAsync`: POST to `/api/notifications/{id}/mark-as-read` with empty body; on exception or non-2xx log via `_logger` and return (do not rethrow)
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 8. Register INotificationClient in ContosoUniversity DI
  - [ ] 8.1 Update Program.cs to register typed HttpClient
    - In `ContosoUniversity/Program.cs` add: `builder.Services.AddHttpClient<INotificationClient, NotificationClient>(client => { client.BaseAddress = new Uri("http://localhost:5051"); });`
    - Add required `using ContosoUniversity.Services;` directive
    - _Requirements: 7.1_

- [ ] 9. Refactor BaseController to use INotificationClient
  - [ ] 9.1 Replace NotificationService field with INotificationClient injection
    - In `ContosoUniversity/Controllers/BaseController.cs`:
      - Remove `protected NotificationService notificationService = new NotificationService()` field
      - Add `protected readonly INotificationClient _notificationClient` field
      - Change constructor signature to `BaseController(SchoolContext context, INotificationClient notificationClient)` and assign `_notificationClient = notificationClient`
      - Remove the `Dispose` override that called `notificationService?.Dispose()`
      - Update `SendEntityNotification(string entityType, string entityId, string entityDisplayName, EntityOperation operation)`: build a `Notification` object with `EntityType`, `EntityId`, `Operation = operation.ToString()`, `Message` (using the same `GenerateMessage`-style logic from the legacy `NotificationService`), `CreatedAt = DateTime.UtcNow`, `CreatedBy = "System"`, `IsRead = false`; call `_notificationClient.SendNotificationAsync(notification).GetAwaiter().GetResult()` inside the existing try/catch; log exceptions to `Debug.WriteLine` without rethrowing
      - Keep both overloads of `SendEntityNotification` (with and without `entityDisplayName`)
      - Remove `using ContosoUniversity.Services` reference to `NotificationService` (keep `INotificationClient` using)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 10. Update all six controllers to pass INotificationClient to BaseController
  - [ ] 10.1 Update StudentsController constructor
    - Change constructor to `StudentsController(SchoolContext context, INotificationClient notificationClient) : base(context, notificationClient)`
    - Add `using ContosoUniversity.Services;` if not present
    - _Requirements: 9.1_

  - [ ] 10.2 Update CoursesController constructor
    - Change constructor to `CoursesController(SchoolContext context, IWebHostEnvironment env, INotificationClient notificationClient) : base(context, notificationClient)`
    - _Requirements: 9.2_

  - [ ] 10.3 Update DepartmentsController constructor
    - Change constructor to `DepartmentsController(SchoolContext context, INotificationClient notificationClient) : base(context, notificationClient)`
    - _Requirements: 9.3_

  - [ ] 10.4 Update InstructorsController constructor
    - Change constructor to `InstructorsController(SchoolContext context, INotificationClient notificationClient) : base(context, notificationClient)`
    - _Requirements: 9.4_

  - [ ] 10.5 Update HomeController constructor
    - Change constructor to `HomeController(SchoolContext context, INotificationClient notificationClient) : base(context, notificationClient)`
    - No notification calls are added to action methods; injection is required only to satisfy the base constructor
    - _Requirements: 9.5_

  - [ ] 10.6 Update NotificationsController constructor and action methods
    - Change constructor to `NotificationsController(SchoolContext context, INotificationClient notificationClient) : base(context, notificationClient)`
    - Replace `notificationService.ReceiveNotification()` loop in `GetNotifications()` with a single call to `_notificationClient.GetNotificationsAsync().GetAwaiter().GetResult()` (or `await` if the method becomes async); return `Json(new { success = true, notifications = notifications, count = notifications.Count })`
    - Replace `notificationService.MarkAsRead(id)` in `MarkAsRead(int id)` with `_notificationClient.MarkAsReadAsync(id).GetAwaiter().GetResult()`; return `Json(new { success = true })`
    - Remove `using ContosoUniversity.Services` reference to `NotificationService` directly; keep `INotificationClient`
    - _Requirements: 9.6, 9.7, 9.8, 11.2, 11.3, 11.4_

- [ ] 11. Remove legacy NotificationService from ContosoUniversity
  - [ ] 11.1 Delete Services/NotificationService.cs
    - Delete `ContosoUniversity/Services/NotificationService.cs` once all usages in `BaseController.cs` and `NotificationsController.cs` have been replaced by `INotificationClient`
    - _Requirements: 12.1_

  - [ ] 11.2 Remove AWSSDK.SQS package reference from ContosoUniversity.csproj
    - Remove the `<PackageReference Include="AWSSDK.SQS" .../>` line from `ContosoUniversity/ContosoUniversity.csproj`
    - Verify no remaining `.cs` file in ContosoUniversity contains a `using Amazon.SQS` directive
    - _Requirements: 12.2_

  - [ ] 11.3 Remove residual using directives for NotificationService
    - Scan all controller files for any leftover `using ContosoUniversity.Services` directives that referred only to `NotificationService` and remove them
    - _Requirements: 12.4_

- [ ] 12. Final checkpoint — build and verify ContosoUniversity
  - Run `dotnet build` on the solution; confirm zero errors across both projects
  - Confirm `Services/NotificationService.cs` no longer exists in ContosoUniversity
  - Confirm `AWSSDK.SQS` no longer appears in `ContosoUniversity.csproj`
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 12.3_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP (no optional tasks in this plan per the user's "no unit tests" constraint)
- All `using` directives for `NotificationService` must be cleaned up in task 11.3 before the final build check
- The `INotificationClient.GetNotificationsAsync` call in `NotificationsController` replaces the while-loop that polled `ReceiveNotification()` one message at a time; the new API endpoint already returns up to 10 messages in one call
- `BaseController.SendEntityNotification` keeps the synchronous `.GetAwaiter().GetResult()` wrapper to avoid making six action methods `async`; this is intentional per the design
- Property-based test tasks are omitted per the user's constraint (no unit tests)

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["4.1", "5.1"] },
    { "id": 5, "tasks": ["7.1"] },
    { "id": 6, "tasks": ["7.2", "8.1"] },
    { "id": 7, "tasks": ["9.1"] },
    { "id": 8, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5", "10.6"] },
    { "id": 9, "tasks": ["11.1"] },
    { "id": 10, "tasks": ["11.2", "11.3"] }
  ]
}
```
