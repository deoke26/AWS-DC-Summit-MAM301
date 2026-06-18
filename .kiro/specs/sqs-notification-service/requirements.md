# Requirements Document

## Introduction

Replace the in-memory ConcurrentQueue-based notification service in the ContosoUniversity modernized application with an Amazon SQS implementation. The existing `INotificationService` interface and `NotificationsController` API remain unchanged — only the underlying queue implementation changes from in-memory to Amazon SQS.

## Glossary

- **SQS_Notification_Service**: The new implementation of `INotificationService` that uses Amazon SQS as the message queue backend
- **SQS_Queue**: The Amazon SQS standard queue at `https://sqs.us-east-1.amazonaws.com/836548370410/contoso-notifications`
- **Notification**: A message representing an entity operation (create, update, delete) serialized as JSON
- **SQS_Client**: The AWS SDK `IAmazonSQS` client used to interact with the SQS queue

## Requirements

### Requirement 1: Send Notifications to SQS

**User Story:** As a developer, I want notifications to be sent to an Amazon SQS queue, so that notifications are durably stored outside the application process.

#### Acceptance Criteria

1. WHEN `SendNotification` is called with entityType, entityId, operation, and optional entityDisplayName and userName parameters, THE SQS_Notification_Service SHALL construct a Notification object with EntityType, EntityId, Operation (as string), Message, CreatedAt, CreatedBy, and IsRead set to false, serialize it to JSON using Newtonsoft.Json, and send it as the message body to the SQS_Queue
2. WHEN `SendNotification` is called with a non-null, non-whitespace entityDisplayName, THE SQS_Notification_Service SHALL include the display name in the Message field formatted as "{entityType} '{entityDisplayName}'"
3. WHEN `SendNotification` is called without a userName, THE SQS_Notification_Service SHALL default the CreatedBy field to "System"
4. WHEN `SendNotification` is called with a null or whitespace entityDisplayName, THE SQS_Notification_Service SHALL format the Message field using the entityId as "{entityType} (ID: {entityId})"
5. WHEN `SendNotification` is called, THE SQS_Notification_Service SHALL set the CreatedAt field to the current UTC timestamp

### Requirement 2: Receive Notifications from SQS

**User Story:** As a developer, I want to receive notifications from the SQS queue, so that the notification dashboard can display pending messages.

#### Acceptance Criteria

1. WHEN `ReceiveNotification` is called, THE SQS_Notification_Service SHALL call ReceiveMessage on the SQS_Queue with MaxNumberOfMessages set to 1 and WaitTimeSeconds set to 0 (short polling)
2. WHEN a message is received from the SQS_Queue, THE SQS_Notification_Service SHALL deserialize the message body from JSON into a Notification object using Newtonsoft.Json
3. WHEN a message is successfully received and deserialized, THE SQS_Notification_Service SHALL delete that message from the SQS_Queue using its ReceiptHandle before returning the Notification
4. WHEN no messages are available in the SQS_Queue, THE SQS_Notification_Service SHALL return null

### Requirement 3: AWS SDK Integration

**User Story:** As a developer, I want the SQS client registered in dependency injection, so that the service uses the standard AWS SDK patterns for .NET 8.

#### Acceptance Criteria

1. THE application SHALL add the AWSSDK.SQS NuGet package to ContosoUniversity.csproj
2. THE application SHALL register `IAmazonSQS` as a singleton in the DI container, configured with region `us-east-1`
3. THE SQS_Notification_Service SHALL read the queue URL from the `AWS:SQS:QueueUrl` configuration key in appsettings.json, with value `https://sqs.us-east-1.amazonaws.com/836548370410/contoso-notifications`
4. THE SQS_Notification_Service SHALL accept `IAmazonSQS` and `IConfiguration` via constructor injection

### Requirement 4: Interface and Registration Compatibility

**User Story:** As a developer, I want the new SQS implementation to be a drop-in replacement, so that no changes are needed to controllers or other consumers.

#### Acceptance Criteria

1. THE SQS_Notification_Service SHALL implement all four methods of the existing `INotificationService` interface (`SendNotification(string, string, EntityOperation, string)`, `SendNotification(string, string, string, EntityOperation, string)`, `ReceiveNotification()`, and `MarkAsRead(int)`) with identical method signatures including parameter names, types, and default values
2. THE SQS_Notification_Service SHALL be registered as Scoped in the DI container using `AddScoped<INotificationService, SqsNotificationService>()`, replacing the current `NotificationService` registration in Program.cs
3. THE SQS_Notification_Service SHALL implement `IDisposable` and release any SQS client resources when `Dispose()` is called
4. WHEN the SQS_Notification_Service is resolved via dependency injection, THE SQS_Notification_Service SHALL require no constructor parameters beyond those available in the DI container, so that existing controller constructors remain unchanged

### Requirement 5: Mark As Read

**User Story:** As a developer, I want the MarkAsRead method to remain functional, so that the API contract is preserved.

#### Acceptance Criteria

1. WHEN `MarkAsRead` is called with any integer notificationId, THE SQS_Notification_Service SHALL return without throwing an exception (no-op implementation, matching current behavior)
2. WHEN `MarkAsRead` is called, THE SQS_Notification_Service SHALL NOT send any requests to the SQS_Queue
