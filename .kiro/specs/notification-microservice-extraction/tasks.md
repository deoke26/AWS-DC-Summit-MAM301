# Implementation Plan: Notification Microservice Extraction

## Overview

Extract the notification functionality from the ContosoUniversity monolith into a standalone .NET 8 Web API microservice (NotificationService.API) on port 5051 with SQS integration, and replace direct NotificationService usage in the main app with a typed HttpClient (INotificationClient/NotificationClient) injected via DI.

## Tasks

- [x] 1. Create NotificationService.API project structure
  - [x] 1.1 Create the NotificationService.API project and add to solution
    - Create a new .NET 8 Web API project at `ContosoUniversity-Modernized/NotificationService.API/` using the controller-based pattern
    - Add `NotificationService.API.csproj` with dependencies: `AWSSDK.SQS`, `Newtonsoft.Json`, `Microsoft.AspNetCore.Mvc.NewtonsoftJson`
    - Add the project to `ContosoUniversity.sln`
    - Configure `Properties/launchSettings.json` with HTTP port 5051
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 1.2 Create Notification model and SendNotificationRequest DTO in the microservice
    - Create `Models/Notification.cs` with Id, EntityType, EntityId, Operation, Message, CreatedAt, CreatedBy, IsRead fields
    - Create `Models/SendNotificationRequest.cs` DTO with `[Required]` validation attributes on EntityType, EntityId, Operation, Message, CreatedAt
    - _Requirements: 1.1, 2.1, 2.4_

  - [x] 1.3 Create appsettings.json with AWS/SQS configuration
    - Add `AWS:Region` set to "us-east-1"
    - Add `AWS:SQS:QueueUrl` set to "https://sqs.us-east-1.amazonaws.com/836548370410/contoso-notifications"
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 1.4 Create Program.cs with DI registration and Newtonsoft.Json configuration
    - Register `IAmazonSQS` as singleton using region from `IConfiguration["AWS:Region"]`
    - Register `ISqsNotificationService` / `SqsNotificationService` as scoped
    - Configure controllers with `.AddNewtonsoftJson()` and `StringEnumConverter`
    - _Requirements: 1.3, 8.4, 8.5_

- [x] 2. Implement SQS service and API endpoints in the microservice
  - [x] 2.1 Create ISqsNotificationService interface and SqsNotificationService implementation
    - Create `Services/ISqsNotificationService.cs` with methods: `SendNotificationAsync`, `ReceiveNotificationsAsync`, `MarkAsReadAsync`
    - Create `Services/SqsNotificationService.cs` that injects `IAmazonSQS` and `IConfiguration`
    - Read queue URL from `IConfiguration["AWS:SQS:QueueUrl"]`
    - Implement `SendNotificationAsync`: serialize Notification with Newtonsoft.Json + StringEnumConverter, call `SendMessageAsync`
    - Implement `ReceiveNotificationsAsync`: call `ReceiveMessageAsync` with MaxNumberOfMessages=10, WaitTimeSeconds=0, deserialize messages, delete each from queue, skip malformed messages
    - Implement `MarkAsReadAsync`: no-op, return immediately
    - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.7, 4.3, 8.1, 8.4_

  - [x] 2.2 Create NotificationsController with all three endpoints
    - Create `Controllers/NotificationsController.cs` with route `[Route("api/notifications")]`
    - Implement `POST /api/notifications`: validate request body (check required fields, validate Operation is CREATE/UPDATE/DELETE), call `ISqsNotificationService.SendNotificationAsync`, return 200 with `{ success: true, messageId }` or 400/500 on failure
    - Implement `GET /api/notifications`: call `ISqsNotificationService.ReceiveNotificationsAsync`, return 200 with JSON array or 500 on failure
    - Implement `POST /api/notifications/{id}/mark-as-read`: validate id is int, call `ISqsNotificationService.MarkAsReadAsync`, return 200 with `{ success: true }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.4, 3.5, 3.6, 4.1, 4.2_

- [x] 3. Checkpoint - Verify microservice builds
  - Ensure `dotnet build` succeeds for the NotificationService.API project, ask the user if questions arise.

- [x] 4. Create INotificationClient and NotificationClient in main app
  - [x] 4.1 Create INotificationClient interface in the main app Services directory
    - Create `Services/INotificationClient.cs` with methods: `SendNotificationAsync(Notification)` returning Task, `GetNotificationsAsync()` returning `Task<List<Notification>>`, `MarkAsReadAsync(int id)` returning Task
    - _Requirements: 5.1_

  - [x] 4.2 Create NotificationClient typed HttpClient implementation
    - Create `Services/NotificationClient.cs` implementing `INotificationClient`
    - Accept `HttpClient` via constructor injection
    - Implement `SendNotificationAsync`: POST to `/api/notifications` with Newtonsoft.Json serialization using StringEnumConverter, swallow errors and log to `System.Diagnostics.Debug`
    - Implement `GetNotificationsAsync`: GET from `/api/notifications`, deserialize JSON array, return empty list on any failure
    - Implement `MarkAsReadAsync`: POST to `/api/notifications/{id}/mark-as-read`, swallow errors gracefully
    - _Requirements: 5.2, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.3 Register INotificationClient in Program.cs with HttpClient configuration
    - Add `builder.Services.AddHttpClient<INotificationClient, NotificationClient>()` with base address `http://localhost:5051` and timeout of 5 seconds
    - _Requirements: 5.3, 7.5_

- [ ] 5. Update BaseController and all controllers for DI
  - [~] 5.1 Update BaseController to use INotificationClient via constructor injection
    - Add `INotificationClient` constructor parameter alongside `SchoolContext`
    - Store as `protected readonly INotificationClient _notificationClient`
    - Remove `protected NotificationService notificationService = new NotificationService()` field
    - Replace `SendEntityNotification` method body to construct a Notification and call `_notificationClient.SendNotificationAsync` with fire-and-forget try/catch
    - Remove the `Dispose` override that disposed `notificationService`
    - _Requirements: 5.4, 6.2, 6.5, 7.1, 7.2_

  - [~] 5.2 Update StudentsController constructor to pass INotificationClient to base
    - Add `INotificationClient notificationClient` parameter to constructor
    - Call `: base(context, notificationClient)`
    - _Requirements: 6.1_

  - [~] 5.3 Update CoursesController constructor to pass INotificationClient to base
    - Add `INotificationClient notificationClient` parameter to constructor
    - Call `: base(context, notificationClient)`
    - _Requirements: 6.1_

  - [~] 5.4 Update DepartmentsController constructor to pass INotificationClient to base
    - Add `INotificationClient notificationClient` parameter to constructor
    - Call `: base(context, notificationClient)`
    - _Requirements: 6.1_

  - [~] 5.5 Update InstructorsController constructor to pass INotificationClient to base
    - Add `INotificationClient notificationClient` parameter to constructor
    - Call `: base(context, notificationClient)`
    - _Requirements: 6.1_

  - [~] 5.6 Update HomeController constructor to pass INotificationClient to base
    - Add `INotificationClient notificationClient` parameter to constructor
    - Call `: base(context, notificationClient)`
    - _Requirements: 6.1_

  - [~] 5.7 Update NotificationsController to use INotificationClient for GetNotifications and MarkAsRead
    - Add `INotificationClient notificationClient` parameter to constructor, call `: base(context, notificationClient)`
    - Replace `GetNotifications` to call `_notificationClient.GetNotificationsAsync()` and return the list
    - Replace `MarkAsRead` to call `_notificationClient.MarkAsReadAsync(id)` with error handling
    - _Requirements: 6.1, 6.3, 6.4_

- [~] 6. Final checkpoint - Build verification
  - Run `dotnet build` on the full solution and ensure both projects compile without errors, ask the user if questions arise.
  - _Requirements: 1.5_

## Notes

- No unit tests per user constraint — verification is via build checks and manual testing
- No authentication, Docker, or health checks included
- The microservice uses Newtonsoft.Json (not System.Text.Json) to maintain serialization consistency with the main app
- Fire-and-forget pattern ensures CRUD operations are never blocked by notification failures
- SQS messages are consumed (deleted) on read per the design — mark-as-read is a no-op
- Controllers 5.2–5.6 are independent and can be updated in parallel

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "2.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "4.2"] },
    { "id": 3, "tasks": ["4.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7"] }
  ]
}
```
