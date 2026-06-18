# Implementation Plan: SQS Notification Service

## Overview

Replace the in-memory ConcurrentQueue notification service with Amazon SQS. Four files are touched: add the AWS SDK package, add configuration, create the new service class, and update DI registration.

## Tasks

- [x] 1. Add AWSSDK.SQS NuGet package and configuration
  - [x] 1.1 Add AWSSDK.SQS package reference to ContosoUniversity.csproj
    - Add `<PackageReference Include="AWSSDK.SQS" Version="3.7.*" />` to the ItemGroup
    - _Requirements: 3.1_

  - [x] 1.2 Add AWS SQS queue URL configuration to appsettings.json
    - Add `"AWS": { "SQS": { "QueueUrl": "https://sqs.us-east-1.amazonaws.com/836548370410/contoso-notifications" } }` section
    - _Requirements: 3.3_

- [x] 2. Implement SqsNotificationService
  - [x] 2.1 Create Services/SqsNotificationService.cs implementing INotificationService
    - Accept `IAmazonSQS` and `IConfiguration` via constructor injection
    - Read queue URL from `AWS:SQS:QueueUrl` configuration key
    - Implement `SendNotification` (both overloads): build Notification object, serialize with Newtonsoft.Json, call `SendMessageAsync`
    - Implement `ReceiveNotification`: call `ReceiveMessageAsync` with MaxNumberOfMessages=1 and WaitTimeSeconds=0, deserialize response, delete message via `DeleteMessageAsync`, return Notification (or null if empty)
    - Implement `MarkAsRead` as a no-op
    - Implement `Dispose` as a no-op (SQS client lifecycle managed by DI)
    - Set `CreatedAt` to `DateTime.UtcNow`, default `CreatedBy` to "System" when userName is null
    - Format Message field: use `"{entityType} '{entityDisplayName}'"` when display name provided, else `"{entityType} (ID: {entityId})"`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 4.1, 4.3, 4.4, 5.1, 5.2_

- [x] 3. Update DI registration in Program.cs
  - [x] 3.1 Register IAmazonSQS and replace NotificationService with SqsNotificationService
    - Add `using Amazon.SQS;` and `using Amazon;` to imports
    - Add `builder.Services.AddSingleton<IAmazonSQS>(sp => new AmazonSQSClient(RegionEndpoint.USEast1));`
    - Replace `AddScoped<INotificationService, NotificationService>()` with `AddScoped<INotificationService, SqsNotificationService>()`
    - _Requirements: 3.2, 4.2_

- [x] 4. Final checkpoint
  - Ensure the project builds without errors. Ask the user if questions arise.

## Notes

- No unit tests or property tests per user request — base functionality only
- Exceptions from the SQS client propagate to the caller; no retry logic included
- The existing `NotificationService.cs` file is left in place (not deleted) to preserve the `INotificationService` interface definition
- Verify the application compiles by running `dotnet build` in the ContosoUniversity-Modernized directory

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1"] }
  ]
}
```
