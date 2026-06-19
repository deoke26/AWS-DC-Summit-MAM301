# Requirements Document

## Introduction

This document defines requirements for deploying the Contoso University application to AWS using AWS CDK (C#). The deployment includes a React single-page application served via CloudFront/S3, the main .NET Web API running on ECS Fargate behind an ALB, a notification microservice on ECS Fargate discovered via Cloud Map, and an Aurora PostgreSQL Serverless v2 database. The CDK project is created in the `infra/` folder at the repository root as a single-stack deployment targeting us-east-1.

### Assumptions

- The existing SQS queue is pre-provisioned and available at the specified URL; the CDK stack does not manage its lifecycle.
- The React frontend uses Vite as its build tool (based on `vite.config.ts` in `client-app/`).
- The main Web API listens on port 80 inside its container.
- The notification microservice listens on port 5051 inside its container.
- Docker build contexts are set to the repository root so that both Dockerfiles can reference sibling folders if needed.
- Aurora Serverless v2 uses default min/max ACU scaling (0.5–1 ACU) since no specific scaling requirements were provided.
- The Cloud Map namespace uses the private DNS name `local` so the notification service is reachable at `notification-service.local`.
- No data seeding or database migration is performed as part of the CDK deployment.
- The React frontend communicates with the Web API via relative paths (e.g., `/api/...`) proxied through the ALB or configured at build time.
- .NET 8.0 is assumed as the target framework for both services.

## Glossary

- **CDK_Stack**: The single AWS CDK stack defined in C# that provisions all infrastructure resources for the Contoso University application.
- **VPC**: The Amazon Virtual Private Cloud network containing all deployed resources, configured with public and private subnets across two Availability Zones.
- **Frontend_Distribution**: The Amazon CloudFront distribution paired with an S3 bucket that serves the React single-page application.
- **Main_API_Service**: The ECS Fargate service running the Contoso University .NET Web API in a private subnet behind a public Application Load Balancer.
- **Notification_Service**: The ECS Fargate service running the notification microservice in a private subnet, registered with Cloud Map for service discovery.
- **ALB**: The Application Load Balancer that routes HTTP traffic on port 80 to the Main API Service.
- **Aurora_Database**: The Aurora PostgreSQL Serverless v2 cluster storing application data, with credentials managed by AWS Secrets Manager.
- **Cloud_Map_Namespace**: The AWS Cloud Map private DNS namespace (`local`) used for service discovery between ECS services.
- **SQS_Queue**: The pre-existing Amazon SQS queue used for messaging between the Main API Service and the Notification Service.
- **Secrets_Manager**: AWS Secrets Manager service storing the Aurora database credentials.
- **Main_API_Task_Role**: The IAM task role assigned to the Main API Service ECS task, granting Secrets Manager and SQS permissions.
- **Notification_Task_Role**: The IAM task role assigned to the Notification Service ECS task, granting SQS permissions.

## Requirements

### Requirement 1: CDK Project Structure

**User Story:** As a DevOps engineer, I want a well-structured CDK project in C#, so that I can deploy and manage the Contoso University infrastructure as code.

#### Acceptance Criteria

1. THE CDK_Stack SHALL be defined as a C# project located in the `infra/` folder at the repository root, containing a `cdk.json` file that specifies the app entry point.
2. THE CDK_Stack SHALL target the `us-east-1` AWS region by setting the environment in the CDK app entry point.
3. THE CDK_Stack SHALL define all infrastructure resources within a single stack.
4. THE CDK_Stack SHALL use the AWS CDK v2 library for .NET (Amazon.CDK.Lib package).
5. THE CDK project SHALL include a `Program.cs` file as the CDK app entry point that instantiates the stack.

### Requirement 2: VPC Networking

**User Story:** As a DevOps engineer, I want a properly configured VPC, so that application components are deployed with appropriate network isolation.

#### Acceptance Criteria

1. THE CDK_Stack SHALL create a new VPC spanning 2 Availability Zones.
2. THE VPC SHALL contain one public subnet and one private subnet (with egress) in each Availability Zone.
3. THE VPC SHALL include exactly 1 NAT Gateway to allow private subnet resources to reach the internet while minimizing cost.

### Requirement 3: React Frontend Hosting

**User Story:** As a user, I want the React frontend served via a CDN, so that I get fast page loads and proper SPA routing.

#### Acceptance Criteria

1. THE CDK_Stack SHALL create an S3 bucket with Block Public Access enabled to store the React frontend static assets produced by the Vite build output (`dist/` directory) from `ContosoUniversity-Modernized/client-app/`.
2. THE CDK_Stack SHALL create a CloudFront distribution that serves content from the S3 bucket with the default root object set to `index.html`.
3. IF a request path does not match a stored object in the S3 bucket (resulting in a 403 or 404 HTTP status from the origin), THEN THE Frontend_Distribution SHALL return the contents of `index.html` with HTTP status code 200, enabling SPA client-side routing.
4. THE Frontend_Distribution SHALL restrict direct public access to the S3 bucket using an Origin Access Identity or Origin Access Control.

### Requirement 4: Main Web API Deployment

**User Story:** As a DevOps engineer, I want the main Web API running on ECS Fargate behind a load balancer, so that it is scalable and accessible over HTTP.

#### Acceptance Criteria

1. THE CDK_Stack SHALL create an ECS Fargate service for the Main_API_Service in a private subnet with a desired task count of 1.
2. THE Main_API_Service SHALL use a task definition with 256 CPU units and 512 MB memory.
3. THE Main_API_Service SHALL build its container image from the Dockerfile at `ContosoUniversity-Modernized/Dockerfile`.
4. THE CDK_Stack SHALL create a public ALB that listens on port 80 (HTTP) and forwards traffic to the Main_API_Service container on port 80.
5. THE ALB SHALL perform an HTTP health check against the Main_API_Service on port 80 to determine task health before routing traffic.
6. THE Main_API_Service SHALL receive Aurora_Database connection credentials as environment variables sourced from Secrets_Manager.
7. THE Main_API_Service SHALL receive the SQS_Queue URL as an environment variable.
8. THE Main_API_Service SHALL receive the Notification_Service discovery endpoint (`http://notification-service.local:5051`) as an environment variable.
9. THE CDK_Stack SHALL configure the Main_API_Service security group to allow inbound traffic only from the ALB security group on port 80.

### Requirement 5: Notification Microservice Deployment

**User Story:** As a DevOps engineer, I want the notification microservice running on ECS Fargate with service discovery, so that the main API can locate it without hardcoded IP addresses.

#### Acceptance Criteria

1. THE CDK_Stack SHALL create an ECS Fargate service for the Notification_Service in a private subnet with a desired task count of 1.
2. THE Notification_Service SHALL use a task definition with 256 CPU units and 512 MB memory.
3. THE Notification_Service SHALL build its container image from the Dockerfile at `NotificationService.API/Dockerfile`.
4. THE CDK_Stack SHALL create a Cloud_Map_Namespace with the private DNS name `local` associated with the VPC.
5. THE Notification_Service SHALL register with Cloud_Map_Namespace under the service name `notification-service`, making it discoverable at `notification-service.local` on port 5051.
6. THE Notification_Service SHALL receive the SQS_Queue URL as an environment variable named `AWS__SQS__QueueUrl`.
7. THE CDK_Stack SHALL configure the Notification_Service security group to allow inbound traffic from the Main_API_Service security group on port 5051.

### Requirement 6: Aurora PostgreSQL Database

**User Story:** As a DevOps engineer, I want a managed serverless PostgreSQL database, so that the application has a reliable and scalable data store without manual capacity management.

#### Acceptance Criteria

1. THE CDK_Stack SHALL create an Aurora PostgreSQL Serverless v2 cluster within the private subnets of the VPC with a minimum capacity of 0.5 ACU and a maximum capacity of 1 ACU.
2. THE Aurora_Database SHALL store its master credentials in Secrets_Manager with auto-generated username and password.
3. THE Aurora_Database security group SHALL allow inbound connections on port 5432 only from the Main_API_Service security group.
4. THE Aurora_Database SHALL use the PostgreSQL engine compatible with Aurora Serverless v2.
5. THE Aurora_Database cluster SHALL include one writer instance.

### Requirement 7: Dockerfiles

**User Story:** As a DevOps engineer, I want multi-stage Dockerfiles for both .NET services, so that container images are optimized for production with minimal size and attack surface.

#### Acceptance Criteria

1. THE CDK_Stack SHALL expect a Dockerfile at `ContosoUniversity-Modernized/Dockerfile` that uses a multi-stage build with the .NET 8.0 SDK image for building and the ASP.NET 8.0 runtime image for the final stage.
2. THE CDK_Stack SHALL expect a Dockerfile at `NotificationService.API/Dockerfile` that uses a multi-stage build with the .NET 8.0 SDK image for building and the ASP.NET 8.0 runtime image for the final stage.
3. WHEN building the Main_API_Service container image, THE CDK_Stack SHALL use the repository root as the Docker build context.
4. WHEN building the Notification_Service container image, THE CDK_Stack SHALL use the repository root as the Docker build context.
5. THE Dockerfile for Main_API_Service SHALL publish the application in Release configuration and expose port 80 in the final stage.
6. THE Dockerfile for Notification_Service SHALL publish the application in Release configuration and expose port 5051 in the final stage.
7. THE final stage of each Dockerfile SHALL run the application as a non-root user.

### Requirement 8: IAM Permissions

**User Story:** As a security engineer, I want least-privilege IAM roles for each service, so that containers only have access to the AWS resources they need.

#### Acceptance Criteria

1. THE Main_API_Task_Role SHALL grant read access to the specific Aurora_Database credentials secret in Secrets_Manager (scoped to the secret ARN).
2. THE Main_API_Task_Role SHALL grant `sqs:SendMessage` and `sqs:ReceiveMessage` permissions scoped to the SQS_Queue ARN.
3. THE Notification_Task_Role SHALL grant `sqs:SendMessage`, `sqs:ReceiveMessage`, and `sqs:DeleteMessage` permissions scoped to the SQS_Queue ARN.
4. THE Main_API_Task_Role SHALL NOT grant any permissions beyond Secrets Manager read and SQS send/receive.
5. THE Notification_Task_Role SHALL NOT grant any permissions beyond SQS send/receive/delete.
6. THE CDK_Stack SHALL create ECS task execution roles with permissions to pull container images from ECR and write logs to CloudWatch Logs.

### Requirement 9: Messaging Integration

**User Story:** As a DevOps engineer, I want the deployment to reference the existing SQS queue without creating a new one, so that messaging infrastructure remains consistent with other environments.

#### Acceptance Criteria

1. THE CDK_Stack SHALL NOT create a new SQS queue.
2. THE CDK_Stack SHALL import the existing SQS_Queue using the URL `https://sqs.us-east-1.amazonaws.com/836548370410/contoso-notifications` and the derived ARN `arn:aws:sqs:us-east-1:836548370410:contoso-notifications`, producing a queue construct usable for IAM policy grants.
3. THE CDK_Stack SHALL pass the SQS_Queue URL to both the Main_API_Service and the Notification_Service containers as the environment variable `AWS__SQS__QueueUrl`.

### Requirement 10: Deployment Constraints

**User Story:** As a DevOps engineer, I want a minimal base infrastructure deployment, so that complexity is kept low and the stack focuses only on essential resources.

#### Acceptance Criteria

1. THE ALB SHALL listen on HTTP (port 80) only.
2. THE CDK_Stack SHALL NOT configure HTTPS/TLS listeners or provision ACM certificates.
3. THE CDK_Stack SHALL NOT configure custom domain names or Route 53 records.
4. THE CDK_Stack SHALL NOT create a CI/CD pipeline.
5. THE CDK_Stack SHALL NOT create or attach a WAF (Web Application Firewall).
6. THE Main_API_Service and THE Notification_Service SHALL each run with a desired task count of 1.
