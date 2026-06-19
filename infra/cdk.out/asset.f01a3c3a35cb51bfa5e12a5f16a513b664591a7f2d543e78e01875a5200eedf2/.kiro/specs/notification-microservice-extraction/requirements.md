# Requirements Document

## Introduction

This document specifies the requirements for extracting the notification functionality from the ContosoUniversity monolithic application into a standalone ASP.NET Core Web API microservice (NotificationService.API). The main application will communicate with the new microservice over HTTP using a typed HttpClient, replacing direct in-process NotificationService usage. The microservice will interact with Amazon SQS for message queuing, preserving the existing notification semantics.

### Assumptions

- The modernized ContosoUniversity app targets .NET 8 (same as the new microservice).
- The new microservice runs on the same machine or network as the main app (localhost communication, no authentication required).
- The SQS queue already exists and is accessible with ambient AWS credentials (IAM role, environment variables, or AWS CLI profile).
- The Notification model schema (EntityType, EntityId, Operation, Message, CreatedAt, CreatedBy, IsRead) remains unchanged.
- "Mark as read" is a logical operation — since SQS messages are consumed on read, the mark-as-read endpoint is a no-op that returns success.
- Controllers that currently call SendEntityNotification are: Students, Courses, Departments, Instructors, Home, and Notifications (6 controllers inheriting from BaseController).
- The microservice uses controllers (not minimal APIs).

## Glossary

- **Notification_Microservice**: The new ASP.NET Core Web API project (NotificationService.API) that exposes notification operations over HTTP and communicates with SQS.
- **Main_App**: The existing ContosoUniversity ASP.NET Core MVC application.
- **Notification_Client**: The typed HttpClient implementation (NotificationClient) in the Main_App that communicates with the Notification_Microservice.
- **INotificationClient**: The interface abstraction for the Notification_Client, registered in DI.
- **SQS_Queue**: The Amazon SQS queue at URL https://sqs.us-east-1.amazonaws.com/836548370410/contoso-notifications in us-east-1.
- **Notification**: A JSON object containing EntityType, EntityId, Operation, Message, CreatedAt, CreatedBy, and IsRead fields.
- **BaseController**: The abstract base controller in the Main_App from which all entity controllers inherit.

## Requirements

### Requirement 1: Microservice Project Structure

**User Story:** As a developer, I want a separate ASP.NET Core Web API project for notifications, so that the notification service can be deployed and scaled independently.

#### Acceptance Criteria

1. THE Notification_Microservice SHALL be a .NET 8 ASP.NET Core Web API project named "NotificationService.API" using the controller-based pattern (not minimal APIs), added to the existing ContosoUniversity solution file.
2. THE Notification_Microservice SHALL be configured in launchSettings.json to listen on HTTP port 5051 for the default launch profile.
3. THE Notification_Microservice SHALL use Newtonsoft.Json with StringEnumConverter registered as the default JSON serializer for all controller responses and request deserialization.
4. THE Notification_Microservice SHALL include AWSSDK.SQS as a NuGet dependency for SQS communication.
5. WHEN `dotnet build` is run on the solution, THE Notification_Microservice SHALL compile without errors.

### Requirement 2: Send Notification Endpoint

**User Story:** As the main application, I want to POST notification data to the microservice, so that notifications are enqueued to SQS without the main app needing direct SQS access.

#### Acceptance Criteria

1. WHEN a POST request is received at /api/notifications with a JSON body containing all required fields (EntityType: non-empty string, EntityId: non-empty string, Operation: one of "CREATE", "UPDATE", or "DELETE", Message: non-empty string, CreatedAt: valid ISO 8601 datetime, CreatedBy: string), THE Notification_Microservice SHALL serialize the Notification using Newtonsoft.Json with StringEnumConverter and send the message to the SQS_Queue.
2. WHEN the SQS send operation succeeds, THE Notification_Microservice SHALL return HTTP 200 with a JSON response body containing a "success" field set to true and a "messageId" field containing the SQS message identifier.
3. IF the SQS send operation fails, THEN THE Notification_Microservice SHALL return HTTP 500 with a JSON response body containing a "success" field set to false and a "message" field indicating the send failure reason.
4. IF the request body is missing, not valid JSON, or missing any required field (EntityType, EntityId, Operation, Message, CreatedAt), THEN THE Notification_Microservice SHALL return HTTP 400 with a JSON response body containing a "success" field set to false and a "message" field indicating which validation constraint was violated.
5. IF the Operation field contains a value other than "CREATE", "UPDATE", or "DELETE" (case-sensitive), THEN THE Notification_Microservice SHALL return HTTP 400 with a JSON response body containing a "success" field set to false and a "message" field indicating the invalid operation value.

### Requirement 3: Retrieve Notifications Endpoint

**User Story:** As the notification UI, I want to GET pending notifications from the microservice, so that I can display them to the user without direct SQS access.

#### Acceptance Criteria

1. WHEN a GET request is received at /api/notifications, THE Notification_Microservice SHALL call ReceiveMessage on the SQS_Queue with MaxNumberOfMessages set to 10 and WaitTimeSeconds set to 0 (short polling).
2. WHEN messages are received from the SQS_Queue, THE Notification_Microservice SHALL deserialize each SQS message body into a Notification object using Newtonsoft.Json.
3. WHEN messages are successfully retrieved and deserialized, THE Notification_Microservice SHALL delete each message from the SQS_Queue using its ReceiptHandle before returning the response.
4. WHEN messages are successfully retrieved, THE Notification_Microservice SHALL return HTTP 200 with a JSON array of Notification objects.
5. WHEN no messages are available in the SQS_Queue, THE Notification_Microservice SHALL return HTTP 200 with an empty JSON array.
6. IF the SQS receive operation fails, THEN THE Notification_Microservice SHALL return HTTP 500 with an error message indicating the retrieval failure.
7. IF a message body cannot be deserialized into a valid Notification object, THEN THE Notification_Microservice SHALL skip that message, delete it from the SQS_Queue, and exclude it from the response array.

### Requirement 4: Mark Notification As Read Endpoint

**User Story:** As the notification UI, I want to mark a notification as read via the microservice, so that the API contract is preserved.

#### Acceptance Criteria

1. WHEN a POST request is received at /api/notifications/{id}/mark-as-read with a valid integer id parameter, THE Notification_Microservice SHALL return HTTP 200 with a JSON body containing `{ "success": true }`.
2. IF the id parameter is not a valid integer, THEN THE Notification_Microservice SHALL return HTTP 400 with a validation error.
3. THE Notification_Microservice SHALL implement mark-as-read as a no-op (no persistent storage or SQS interaction required), preserving the existing API contract.

### Requirement 5: Typed HttpClient Integration in Main App

**User Story:** As a developer, I want the main app to use a typed HttpClient to communicate with the notification microservice, so that direct SQS coupling is removed from the monolith.

#### Acceptance Criteria

1. THE Main_App SHALL define an INotificationClient interface with the following async methods: `SendNotificationAsync(Notification notification)` returning Task, `GetNotificationsAsync()` returning Task<List<Notification>>, and `MarkAsReadAsync(int id)` returning Task.
2. THE Main_App SHALL provide a NotificationClient class that implements INotificationClient, accepts HttpClient via constructor injection, and uses it to call the Notification_Microservice endpoints.
3. THE Main_App SHALL configure the HttpClient with a hardcoded base address of "http://localhost:5051" using `AddHttpClient<INotificationClient, NotificationClient>()` in Program.cs.
4. THE BaseController SHALL receive INotificationClient via constructor injection, replacing the direct NotificationService instantiation.
5. THE NotificationClient SHALL serialize request bodies using Newtonsoft.Json with StringEnumConverter to match the microservice serialization.

### Requirement 6: Controller Migration to DI

**User Story:** As a developer, I want all controllers to use DI-injected INotificationClient, so that notification sending is decoupled from the SQS implementation.

#### Acceptance Criteria

1. THE Main_App SHALL update all six controllers (StudentsController, CoursesController, DepartmentsController, InstructorsController, HomeController, NotificationsController) to pass INotificationClient to BaseController via constructor injection using `: base(notificationClient)`.
2. THE BaseController SHALL replace the SendEntityNotification method body to call INotificationClient.SendNotificationAsync, constructing the Notification object with EntityType, EntityId, Operation, Message, CreatedAt, and CreatedBy fields.
3. THE NotificationsController SHALL use INotificationClient.GetNotificationsAsync to retrieve notifications for the notification dashboard UI.
4. THE NotificationsController SHALL use INotificationClient.MarkAsReadAsync to mark notifications as read.
5. THE BaseController SHALL remove the direct `NotificationService notificationService = new NotificationService()` field instantiation.

### Requirement 7: Fire-and-Forget Error Handling

**User Story:** As a user, I want CRUD operations to succeed even when the notification microservice is unavailable, so that notification failures do not disrupt core functionality.

#### Acceptance Criteria

1. WHEN the Notification_Microservice is unreachable during a SendNotificationAsync call, THE Main_App SHALL catch the exception, log the failure message to the application diagnostics output, and allow the CRUD operation to complete successfully with the entity persisted to the database.
2. WHEN the Notification_Microservice returns an HTTP error during a SendNotificationAsync call, THE Main_App SHALL log the error and allow the CRUD operation to complete successfully.
3. WHEN the Notification_Microservice is unreachable during a GetNotificationsAsync call, THE NotificationsController SHALL return an empty notifications list to the UI without throwing an unhandled exception.
4. WHEN the Notification_Microservice is unreachable during a MarkAsReadAsync call, THE NotificationsController SHALL handle the error gracefully without crashing.
5. THE NotificationClient SHALL set a maximum timeout of 5 seconds for any individual HTTP request, so that notification failures do not block CRUD operations beyond that duration.

### Requirement 8: SQS Configuration

**User Story:** As a developer, I want the SQS queue URL and region to be configured in the microservice, so that the queue connection details are centralized.

#### Acceptance Criteria

1. THE Notification_Microservice SHALL use the SQS queue URL "https://sqs.us-east-1.amazonaws.com/836548370410/contoso-notifications" for all send, receive, and delete queue operations.
2. THE Notification_Microservice SHALL use the AWS region "us-east-1" for the SQS client configuration.
3. THE Notification_Microservice SHALL store the queue URL under the configuration key path "AWS:SQS:QueueUrl" and the region under "AWS:Region" in appsettings.json within a top-level "AWS" section.
4. THE Notification_Microservice SHALL read the queue URL and region values from IConfiguration at service construction time, not from hardcoded values in the service implementation.
5. THE Notification_Microservice SHALL register IAmazonSQS as a singleton in the DI container, configured with the region from appsettings.json.
