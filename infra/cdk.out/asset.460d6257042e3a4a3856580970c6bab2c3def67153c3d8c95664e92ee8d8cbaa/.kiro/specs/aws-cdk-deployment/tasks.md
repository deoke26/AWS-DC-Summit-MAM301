# Implementation Plan: AWS CDK Deployment

## Overview

Implement the Contoso University AWS infrastructure as a single CDK stack in C#. The implementation proceeds incrementally: project scaffolding, then networking, frontend hosting, database, compute (ECS Fargate services), service discovery, messaging integration, IAM policies, Dockerfiles, and finally CDK assertion tests. Each step builds on the prior constructs so there is no orphaned code.

## Tasks

- [x] 1. Set up CDK project structure and dependencies
  - [x] 1.1 Initialize CDK project with cdk.json, Program.cs, and Infra.csproj
    - Create `infra/cdk.json` with app command `dotnet run --project src/Infra/Infra.csproj`
    - Create `infra/src/Infra/Infra.csproj` referencing `Amazon.CDK.Lib` and `Constructs` NuGet packages
    - Create `infra/src/Infra/Program.cs` that instantiates `App`, creates `ContosoStack` with `us-east-1` environment, and calls `app.Synth()`
    - Create empty `infra/src/Infra/ContosoStack.cs` skeleton class extending `Stack`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Set up test project structure
    - Create `infra/test/Infra.Tests/Infra.Tests.csproj` referencing `Amazon.CDK.Assertions`, `xunit`, and the main Infra project
    - Create empty `infra/test/Infra.Tests/ContosoStackTests.cs` test class
    - _Requirements: 1.1_

- [x] 2. Implement VPC networking
  - [x] 2.1 Add VPC construct to ContosoStack
    - Create VPC with `MaxAzs = 2` and `NatGateways = 1`
    - VPC should have public and private-with-egress subnet configuration
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 2.2 Write CDK assertion tests for VPC
    - Assert VPC resource exists with 2 AZs
    - Assert exactly 1 NAT Gateway is created
    - Assert both public and private subnets are present
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Implement Aurora PostgreSQL Serverless v2 database
  - [x] 3.1 Add Aurora cluster and writer instance to ContosoStack
    - Create `DatabaseCluster` with PostgreSQL engine compatible with Aurora Serverless v2
    - Configure Serverless v2 scaling with min 0.5 ACU and max 1 ACU
    - Enable Secrets Manager credential generation (auto-generated username/password)
    - Place cluster in VPC private subnets
    - Add one writer instance (`CfnDBInstance` or writer config)
    - Create security group for Aurora allowing inbound on port 5432 (source will be Main API SG, wired in step 5)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 3.2 Write CDK assertion tests for Aurora database
    - Assert Aurora cluster has Serverless v2 scaling configuration
    - Assert Secrets Manager secret is created for credentials
    - Assert DB instance exists as writer
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 4. Implement React frontend hosting (CloudFront + S3)
  - [x] 4.1 Add S3 bucket and CloudFront distribution to ContosoStack
    - Create S3 bucket with `BlockPublicAccess.BLOCK_ALL`
    - Create Origin Access Control for CloudFront → S3
    - Create CloudFront distribution with S3 as origin, default root object `index.html`
    - Add custom error responses: 403 → `/index.html` (200), 404 → `/index.html` (200) for SPA routing
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.2 Write CDK assertion tests for frontend hosting
    - Assert S3 bucket has BlockPublicAccess enabled
    - Assert CloudFront distribution exists with custom error responses for 403 and 404
    - Assert Origin Access Control is configured
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Checkpoint - Verify infrastructure foundation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement ECS cluster and Main API service
  - [x] 6.1 Add ECS cluster, Main API task definition, and Fargate service
    - Create ECS Cluster in the VPC
    - Create Fargate task definition with 256 CPU and 512 MB memory
    - Build container image from `ContosoUniversity-Modernized/Dockerfile` with Docker build context set to repository root
    - Add container to task definition mapping port 80
    - Create Fargate service in private subnets with desired count 1
    - Create security group for Main API allowing inbound on port 80 from ALB SG only
    - Wire Aurora security group to allow inbound from Main API SG on port 5432
    - _Requirements: 4.1, 4.2, 4.3, 4.9, 6.3_

  - [x] 6.2 Add Application Load Balancer for Main API
    - Create public ALB in VPC public subnets
    - Add HTTP listener on port 80
    - Add target group pointing to Main API service on port 80
    - Configure health check on port 80
    - _Requirements: 4.4, 4.5, 10.1_

  - [ ]* 6.3 Write CDK assertion tests for Main API and ALB
    - Assert ECS task definition has 256 CPU / 512 memory
    - Assert ALB listener is on port 80
    - Assert security group ingress rules are correct
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.9_

- [x] 7. Implement Cloud Map service discovery and Notification service
  - [x] 7.1 Add Cloud Map namespace and Notification service
    - Create `PrivateDnsNamespace` with name `local` associated with VPC
    - Create Fargate task definition for Notification Service with 256 CPU and 512 MB memory
    - Build container image from `NotificationService.API/Dockerfile` with Docker build context set to repository root
    - Add container to task definition mapping port 5051
    - Create Fargate service in private subnets with desired count 1
    - Register service with Cloud Map under name `notification-service` on port 5051
    - Create security group for Notification Service allowing inbound from Main API SG on port 5051
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_

  - [ ]* 7.2 Write CDK assertion tests for Notification service and Cloud Map
    - Assert Cloud Map private DNS namespace with name `local` exists
    - Assert Notification Service task definition has 256 CPU / 512 memory
    - Assert service discovery registration on port 5051
    - Assert security group allows inbound from Main API SG on port 5051
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.7_

- [x] 8. Implement messaging integration (SQS import)
  - [x] 8.1 Import existing SQS queue and pass environment variables
    - Import SQS queue using `Queue.FromQueueAttributes` with URL `https://sqs.us-east-1.amazonaws.com/836548370410/contoso-notifications` and ARN `arn:aws:sqs:us-east-1:836548370410:contoso-notifications`
    - Pass `AWS__SQS__QueueUrl` environment variable to Main API container
    - Pass `AWS__SQS__QueueUrl` environment variable to Notification Service container
    - Pass `NotificationService__BaseUrl` = `http://notification-service.local:5051` to Main API container
    - Pass Aurora connection string environment variable to Main API container (composed from Secrets Manager secret)
    - _Requirements: 9.1, 9.2, 9.3, 4.6, 4.7, 4.8, 5.6_

  - [ ]* 8.2 Write CDK assertion tests for messaging and environment variables
    - Assert no `AWS::SQS::Queue` resource exists in synthesized template
    - Assert container definitions include `AWS__SQS__QueueUrl` environment variable
    - Assert Main API container includes `NotificationService__BaseUrl` environment variable
    - _Requirements: 9.1, 9.2, 9.3, 4.7, 4.8, 5.6_

- [x] 9. Implement IAM permissions (least-privilege)
  - [x] 9.1 Configure task roles with scoped IAM policies
    - Grant Main API task role read access to the Aurora Secrets Manager secret ARN
    - Grant Main API task role `sqs:SendMessage` and `sqs:ReceiveMessage` scoped to the SQS queue ARN
    - Grant Notification Service task role `sqs:SendMessage`, `sqs:ReceiveMessage`, and `sqs:DeleteMessage` scoped to the SQS queue ARN
    - Ensure task execution roles have permissions to pull from ECR and write to CloudWatch Logs
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 9.2 Write CDK assertion tests for IAM policies
    - Assert Main API task role has Secrets Manager read permission scoped to secret ARN
    - Assert Main API task role has SQS SendMessage/ReceiveMessage scoped to queue ARN
    - Assert Notification task role has SQS Send/Receive/DeleteMessage scoped to queue ARN
    - Assert no additional permissions beyond those specified
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Checkpoint - Verify complete stack
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Create Dockerfiles for both services
  - [x] 11.1 Create multi-stage Dockerfile for Main API
    - Create `ContosoUniversity-Modernized/Dockerfile` with build stage using `mcr.microsoft.com/dotnet/sdk:8.0`
    - Copy project files and run `dotnet publish -c Release`
    - Create runtime stage using `mcr.microsoft.com/dotnet/aspnet:8.0`
    - Add non-root user and switch to it
    - Expose port 80 and set `ASPNETCORE_URLS=http://+:80`
    - _Requirements: 7.1, 7.3, 7.5, 7.7_

  - [x] 11.2 Create multi-stage Dockerfile for Notification Service
    - Create `NotificationService.API/Dockerfile` with build stage using `mcr.microsoft.com/dotnet/sdk:8.0`
    - Copy project files and run `dotnet publish -c Release`
    - Create runtime stage using `mcr.microsoft.com/dotnet/aspnet:8.0`
    - Add non-root user and switch to it
    - Expose port 5051 and set `ASPNETCORE_URLS=http://+:5051`
    - _Requirements: 7.2, 7.4, 7.6, 7.7_

- [x] 12. Final checkpoint - Verify all tests pass and stack synthesizes
  - Ensure all tests pass, ask the user if questions arise.
  - Run `cdk synth` to validate the stack produces valid CloudFormation.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- No property-based tests are included because CDK code is declarative IaC configuration (see design Testing Strategy section)
- CDK assertion tests use `Amazon.CDK.Assertions` to verify the synthesized CloudFormation template
- Docker build context for both services is the repository root to enable sibling folder references
- The SQS queue is never created — only imported by URL/ARN

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1", "4.1"] },
    { "id": 3, "tasks": ["3.2", "4.2", "6.1"] },
    { "id": 4, "tasks": ["6.2", "6.3", "7.1"] },
    { "id": 5, "tasks": ["7.2", "8.1"] },
    { "id": 6, "tasks": ["8.2", "9.1"] },
    { "id": 7, "tasks": ["9.2", "11.1", "11.2"] }
  ]
}
```
