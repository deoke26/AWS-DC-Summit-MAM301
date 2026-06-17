# Requirements Document

## Introduction

This feature extracts the existing `NotificationService` from the ContosoUniversity ASP.NET Core MVC application into a standalone `NotificationService.API` microservice. The new microservice exposes three HTTP endpoints that wrap the existing Amazon SQS send/receive/mark-as-read operations. The main ContosoUniversity application is updated to call the microservice via a typed `HttpClient` instead of instantiating `NotificationService` directly, preserving the existing fire-and-forget, non-blocking behavior for all CRUD controllers.

## Glossary

- **NotificationService.API**: The new ASP.NET Core Web API microservice project (target framework .NET 8) added to the existing `ContosoUniversity.sln` solution.
- **ContosoUniversity**: The existing ASP.NET Core MVC host application.
- **INotificationClient**: The typed `HttpClient` interface defined in ContosoUniversity that abstracts all HTTP calls to NotificationService.API.
- **NotificationClient**: The concrete implementation of `INotificationClient` that uses `HttpClient` to call NotificationService.API.
- **Notification**: The data model representing a notification event, containing `Id`, `EntityType`, `EntityId`, `Operation`, `Message`, `CreatedAt`, `CreatedBy`, `IsRead`, and `ReadAt`.
- **EntityOperation**: The enum with values `CREATE`, `UPDATE`, `DELETE` serialized as strings.
- **SQS_Queue**: The Amazon SQS FIFO queue at `https://sqs.us-east-1.amazonaws.com/836548370410/contoso-notifications` in region `us-east-1`.
- **BaseController**: The abstract ASP.NET MVC base class in ContosoUniversity from which all six entity controllers inherit.
- **SendEntityNotification**: The protected helper method on `BaseController` that triggers a fire-and-forget notification call.

## Documented Assumptions

- AWS credentials for SQS access are available to NotificationService.API via the default AWS credential chain (environment variables, instance profile, or `~/.aws/credentials`); no explicit credential configuration is added.
- `MarkAsRead` on the SQS-backed service has no persistent store for read status (matching the existing no-op implementation); the endpoint returns HTTP 200 unconditionally as long as the notification ID is a valid integer.
- The `Notification.Id` field in a message retrieved from SQS is not guaranteed to be unique across poll cycles; the mark-as-read endpoint accepts the `id` path parameter as provided by the caller and performs a best-effort operation.
- Both projects share the same `Notification` and `EntityOperation` types; the shared model is copied (not extracted into a shared class library) to keep scope minimal.
- NotificationService.API does not use HTTPS in development; only HTTP on port 5051 is configured in `launchSettings.json`.
- The main app continues to call the notification API using plain HTTP (`http://localhost:5051`).
- Newtonsoft.Json with `StringEnumConverter` is used for serialization in both the API and the `HttpClient` implementation, matching the current SQS message format.
- The ContosoUniversity main app's existing `NotificationService.cs` file is removed after the client refactor is complete.
- All six controllers that extend `BaseController` — `StudentsController`, `CoursesController`, `DepartmentsController`, `InstructorsController`, `HomeController`, and `NotificationsController` — are updated.
- `HomeController` does not currently call `SendEntityNotification`; no notification call is added to it beyond constructor injection.
- `NotificationsController` in ContosoUniversity continues to serve the `Views/Notifications/Index.cshtml` view and calls `INotificationClient` for `GetNotifications` and `MarkAsRead`.

---

## Requirements

### Requirement 1: NotificationService.API Project Structure

**User Story:** As a developer, I want a new standalone ASP.NET Core Web API project in the solution, so that notification logic runs as an independently deployable microservice.

#### Acceptance Criteria

1. THE NotificationService.API SHALL target .NET 8 and use the ASP.NET Core Web API project template with controller-based routing (not Minimal APIs).
2. THE NotificationService.API SHALL be added to the existing `ContosoUniversity.sln` solution file.
3. THE NotificationService.API SHALL include NuGet package references for `AWSSDK.SQS` version 3.7.400.2 and `Newtonsoft.Json` version 13.0.3 with exact version pinning.
4. THE NotificationService.API SHALL include a `Notification` model class and `EntityOperation` enum whose public property names, property types, data-annotation attributes, and enum member names are identical to those defined in `ContosoUniversity.Models.Notification` and `ContosoUniversity.Models.EntityOperation`, under the namespace `NotificationService.API.Models`.
5. THE NotificationService.API SHALL configure Kestrel to listen on HTTP port 5051 only (no HTTPS endpoint) in a `Properties/launchSettings.json` profile named `NotificationService.API`.

---

### Requirement 2: POST /api/notifications — Send Notification

**User Story:** As the ContosoUniversity application, I want to POST a Notification object to the API, so that a notification message is published to SQS.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/notifications` with a JSON body that deserializes to a `Notification` object containing non-null `EntityType`, `EntityId`, `Operation`, `Message`, and `CreatedAt` fields, THE NotificationsController SHALL deserialize the body using Newtonsoft.Json with `StringEnumConverter` and send the message to SQS_Queue via `SendMessageAsync`.
2. WHEN the SQS send succeeds, THE NotificationsController SHALL return HTTP 200 OK with an empty response body.
3. IF the request body is null, fails JSON deserialization, or any required field (`EntityType`, `EntityId`, `Operation`, `Message`, `CreatedAt`) is null or empty, THEN THE NotificationsController SHALL return HTTP 400 Bad Request.
4. IF the SQS `SendMessageAsync` call throws an exception, THEN THE NotificationsController SHALL write the exception message to `System.Diagnostics.Debug.WriteLine` and return HTTP 500 Internal Server Error.
5. THE NotificationsController SHALL serialize the `Notification` object to JSON using Newtonsoft.Json with `StringEnumConverter` as the SQS message body, matching the existing serialization format used by the legacy `NotificationService`.

---

### Requirement 3: GET /api/notifications — Retrieve Notifications

**User Story:** As the ContosoUniversity application, I want to GET pending notifications from the API, so that the notification dashboard can display them to the user.

#### Acceptance Criteria

1. WHEN a GET request is received at `/api/notifications`, THE NotificationsController SHALL issue a single SQS receive call to SQS_Queue with `MaxNumberOfMessages = 10` and `WaitTimeSeconds = 0`.
2. WHEN messages are successfully retrieved from SQS, THE NotificationsController SHALL delete each message from SQS_Queue after deserialization, using a best-effort delete that logs failures to `System.Diagnostics.Debug.WriteLine` and does not propagate delete exceptions.
3. WHEN messages are successfully retrieved, THE NotificationsController SHALL return HTTP 200 OK with a JSON array of deserialized `Notification` objects serialized using Newtonsoft.Json with `StringEnumConverter`.
4. WHEN no messages are available in SQS_Queue, THE NotificationsController SHALL return HTTP 200 OK with an empty JSON array (`[]`).
5. IF an exception is thrown during SQS polling, THEN THE NotificationsController SHALL log the exception message to `System.Diagnostics.Debug.WriteLine` and return HTTP 500 Internal Server Error with no response body.
6. IF a retrieved SQS message body cannot be deserialized into a `Notification` object, THEN THE NotificationsController SHALL skip that message, log the deserialization error to `System.Diagnostics.Debug.WriteLine`, perform a best-effort delete of the malformed message, and continue processing remaining messages.

---

### Requirement 4: POST /api/notifications/{id}/mark-as-read — Mark Notification Read

**User Story:** As the ContosoUniversity application, I want to mark a notification as read via the API, so that the UI can reflect the read state.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/notifications/{id}/mark-as-read` with an `id` route parameter that is a valid positive integer (1 to 2,147,483,647), THE NotificationsController SHALL return HTTP 200 OK with a JSON response body containing a `success` field set to `true`.
2. IF the `id` route parameter is not a valid positive integer (e.g., non-numeric string, zero, negative number, or value exceeding 2,147,483,647), THEN THE NotificationsController SHALL return HTTP 400 Bad Request.
3. IF the `id` route parameter is missing from the request path, THEN THE NotificationsController SHALL return HTTP 400 Bad Request.
4. THE NotificationsController SHALL not persist read state to any external store (matching the existing no-op behavior) and SHALL return HTTP 200 OK with `success` set to `true` regardless of whether the `id` corresponds to an existing notification.

---

### Requirement 5: SQS Integration in NotificationService.API

**User Story:** As a developer, I want NotificationService.API to integrate with the existing SQS queue using the same configuration as the current NotificationService, so that no changes are required to queue infrastructure.

#### Acceptance Criteria

1. THE NotificationService.API SHALL use the SQS queue URL `https://sqs.us-east-1.amazonaws.com/836548370410/contoso-notifications` as a hardcoded constant in the SQS service class.
2. THE NotificationService.API SHALL create the `AmazonSQSClient` targeting the `us-east-1` region using `RegionEndpoint.USEast1`.
3. THE NotificationService.API SHALL serialize `Notification` objects using `JsonConvert.SerializeObject` with a `JsonSerializerSettings` containing a `StringEnumConverter`, and deserialize using `JsonConvert.DeserializeObject<Notification>` with the same settings, matching the format currently written to and read from SQS.
4. THE NotificationService.API SHALL register the SQS service class in the DI container in `Program.cs` as a singleton so that a single `AmazonSQSClient` instance is reused across requests.
5. IF the `AmazonSQSClient` cannot be created at startup due to missing AWS credentials or region configuration, THEN THE NotificationService.API SHALL fail to start and log the error.

---

### Requirement 6: INotificationClient Interface and NotificationClient Implementation

**User Story:** As a developer, I want a typed HttpClient abstraction in ContosoUniversity, so that controllers depend on an interface rather than directly on NotificationService or HttpClient.

#### Acceptance Criteria

1. THE ContosoUniversity application SHALL define an `INotificationClient` interface with methods: `Task SendNotificationAsync(Notification notification)`, `Task<IEnumerable<Notification>> GetNotificationsAsync()`, and `Task MarkAsReadAsync(int id)`.
2. THE ContosoUniversity application SHALL provide a `NotificationClient` class that implements `INotificationClient`, accepting `HttpClient` and `ILogger<NotificationClient>` as constructor parameters.
3. WHEN `SendNotificationAsync` is called, THE NotificationClient SHALL POST the serialized `Notification` object as JSON with Content-Type `application/json` to `http://localhost:5051/api/notifications` using Newtonsoft.Json with `StringEnumConverter`.
4. WHEN `GetNotificationsAsync` is called, THE NotificationClient SHALL issue a GET to `http://localhost:5051/api/notifications` and deserialize the returned JSON array into `IEnumerable<Notification>` using Newtonsoft.Json with `StringEnumConverter`.
5. WHEN `MarkAsReadAsync` is called with a notification `id`, THE NotificationClient SHALL issue a POST with an empty body to `http://localhost:5051/api/notifications/{id}/mark-as-read`.
6. THE NotificationClient SHALL use the base address constant `http://localhost:5051` defined as a `private const string` in the `NotificationClient` class.
7. IF any HTTP call throws an exception or returns a non-success status code (HTTP status outside 200–299), THEN THE NotificationClient SHALL log the error using the injected `ILogger<NotificationClient>` and SHALL NOT rethrow the exception, preserving fire-and-forget semantics.
8. IF `GetNotificationsAsync` encounters an error or a non-success response, THEN THE NotificationClient SHALL return an empty collection rather than null.

---

### Requirement 7: Typed HttpClient Registration in ContosoUniversity DI

**User Story:** As a developer, I want `INotificationClient` registered in the ASP.NET Core DI container, so that controllers receive it via constructor injection.

#### Acceptance Criteria

1. THE ContosoUniversity application SHALL register `INotificationClient` and `NotificationClient` in `Program.cs` using `builder.Services.AddHttpClient<INotificationClient, NotificationClient>()`.
2. THE ContosoUniversity application SHALL remove the direct instantiation `new NotificationService()` from `BaseController.cs` (the only location where `NotificationService` is instantiated).
3. THE ContosoUniversity application SHALL NOT register `NotificationService` in the DI container after refactoring.
4. WHEN the application starts, THE DI container SHALL successfully resolve `INotificationClient` for all six controllers that inherit from `BaseController`.

---

### Requirement 8: BaseController Refactored to Use INotificationClient

**User Story:** As a developer, I want `BaseController` to receive `INotificationClient` via constructor injection instead of instantiating `NotificationService` directly, so that the controller does not depend on the concrete SQS service.

#### Acceptance Criteria

1. THE ContosoUniversity application's `BaseController` SHALL declare a constructor parameter of type `INotificationClient` and store it in a `protected readonly` field named `_notificationClient`.
2. THE ContosoUniversity application's `BaseController` SHALL remove the `protected NotificationService notificationService = new NotificationService()` field declaration.
3. WHEN `SendEntityNotification` is called on `BaseController`, THE BaseController SHALL invoke `_notificationClient.SendNotificationAsync` with a fully populated `Notification` object (including `EntityType`, `EntityId`, `Operation`, `Message`, `CreatedAt` set to `DateTime.UtcNow`, `CreatedBy`, and `IsRead` set to `false`).
4. THE ContosoUniversity application's `BaseController` SHALL call `SendNotificationAsync` synchronously using `.GetAwaiter().GetResult()` to preserve the existing synchronous `SendEntityNotification` method signature.
5. THE ContosoUniversity application's `BaseController` SHALL wrap the `_notificationClient.SendNotificationAsync` call in a try/catch block and SHALL log exceptions to `System.Diagnostics.Debug.WriteLine` without rethrowing, maintaining the existing fire-and-forget behavior.
6. THE ContosoUniversity application's `BaseController` SHALL remove the `Dispose` override that previously disposed `NotificationService`.
7. THE ContosoUniversity application's `BaseController` SHALL preserve both overloads of `SendEntityNotification` (with and without `entityDisplayName`).

---

### Requirement 9: All Six Controllers Updated for INotificationClient DI

**User Story:** As a developer, I want all controllers that inherit from `BaseController` to pass `INotificationClient` through to the base constructor, so that the DI container can inject the client at runtime.

#### Acceptance Criteria

1. THE ContosoUniversity application's `StudentsController` SHALL accept `INotificationClient` as a constructor parameter and pass it to `BaseController` via `: base(context, notificationClient)`.
2. THE ContosoUniversity application's `CoursesController` SHALL accept `INotificationClient` as a constructor parameter and pass it to `BaseController` via `: base(context, notificationClient)`.
3. THE ContosoUniversity application's `DepartmentsController` SHALL accept `INotificationClient` as a constructor parameter and pass it to `BaseController` via `: base(context, notificationClient)`.
4. THE ContosoUniversity application's `InstructorsController` SHALL accept `INotificationClient` as a constructor parameter and pass it to `BaseController` via `: base(context, notificationClient)`.
5. THE ContosoUniversity application's `HomeController` SHALL accept `INotificationClient` as a constructor parameter and pass it to `BaseController` via `: base(context, notificationClient)`.
6. THE ContosoUniversity application's `NotificationsController` SHALL accept `INotificationClient` as a constructor parameter and pass it to `BaseController` via `: base(context, notificationClient)`.
7. THE ContosoUniversity application's `NotificationsController` SHALL call `_notificationClient.GetNotificationsAsync()` from its `GetNotifications` action and return the result as a JSON response with `success`, `notifications`, and `count` fields.
8. THE ContosoUniversity application's `NotificationsController` SHALL call `_notificationClient.MarkAsReadAsync(id)` from its `MarkAsRead` action and return a JSON response with a `success` field.

---

### Requirement 10: Fire-and-Forget Error Isolation

**User Story:** As a developer, I want notification failures to be silently swallowed, so that CRUD operations in ContosoUniversity always complete successfully even when NotificationService.API is unreachable.

#### Acceptance Criteria

1. WHEN NotificationService.API is unreachable, times out, or returns an error during a CRUD operation in ContosoUniversity, THE ContosoUniversity application SHALL complete the CRUD operation, persist the entity change to the database, and return the same redirect response as when the notification call succeeds.
2. WHEN an exception is caught in the notification code path, THE ContosoUniversity application SHALL write the exception message to `System.Diagnostics.Debug.WriteLine` and SHALL NOT rethrow the exception to the calling controller action.
3. THE ContosoUniversity application SHALL NOT display any notification-related error to the user via error pages, model-state validation messages, or TempData messages when the notification call fails.
4. WHEN a CRUD operation triggers a notification, THE ContosoUniversity application SHALL commit the database save before invoking the notification call, so that a notification failure cannot roll back the persisted entity change.

---

### Requirement 11: Notification UI Remains in ContosoUniversity

**User Story:** As a developer, I want the notification UI (Views/Notifications/) to remain in the ContosoUniversity project, so that no view-layer changes are required beyond the controller refactor.

#### Acceptance Criteria

1. THE ContosoUniversity application SHALL retain `Views/Notifications/Index.cshtml` with identical file content (byte-for-byte unchanged) after the refactor.
2. THE ContosoUniversity application's `NotificationsController` SHALL expose a parameterless `Index()` action routable via GET at `/Notifications` or `/Notifications/Index` that returns a `ViewResult`.
3. THE ContosoUniversity application's `NotificationsController` SHALL expose a `GetNotifications` action routable via GET at `/Notifications/GetNotifications` that returns a JSON response containing a boolean `success` field, a `notifications` array, and an integer `count` field.
4. WHEN the `GetNotifications` endpoint returns a `notifications` array, THE ContosoUniversity application SHALL include for each notification object the fields `Operation`, `EntityType`, `Message`, `CreatedBy`, and `CreatedAt` so that the existing JavaScript polling logic can render notifications without modification.

---

### Requirement 12: Remove Legacy NotificationService from ContosoUniversity

**User Story:** As a developer, I want the legacy `NotificationService.cs` removed from ContosoUniversity, so that there is a single source of truth for SQS notification logic.

#### Acceptance Criteria

1. WHEN all direct usages of `NotificationService` in `Controllers/BaseController.cs` and `Controllers/NotificationsController.cs` have been replaced with `INotificationClient`, THE ContosoUniversity application SHALL remove the file `Services/NotificationService.cs` from the project.
2. IF no remaining `.cs` file in the ContosoUniversity project contains a `using` directive or type reference to the `Amazon.SQS` namespace, THEN THE ContosoUniversity application SHALL remove the `AWSSDK.SQS` package reference from `ContosoUniversity.csproj`.
3. WHEN `Services/NotificationService.cs` and any unused package references have been removed, THE ContosoUniversity application SHALL compile with zero errors using `dotnet build`.
4. WHEN `Services/NotificationService.cs` has been removed, THE ContosoUniversity application SHALL retain no residual `using ContosoUniversity.Services` directives that referenced only `NotificationService` in any controller file.
