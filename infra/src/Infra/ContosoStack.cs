using Amazon.CDK;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.CloudFront.Origins;
using Amazon.CDK.AWS.EC2;
using Amazon.CDK.AWS.ECS;
using Amazon.CDK.AWS.ElasticLoadBalancingV2;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.RDS;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.S3.Deployment;
using Amazon.CDK.AWS.ServiceDiscovery;
using Amazon.CDK.AWS.SQS;
using System.Collections.Generic;
using Constructs;

public class ContosoStack : Stack
{
    private readonly Vpc _vpc;
    private readonly Bucket _frontendBucket;
    private readonly Distribution _distribution;
    private readonly DatabaseCluster _auroraCluster;
    private readonly SecurityGroup _auroraSg;
    private readonly Amazon.CDK.AWS.ECS.Cluster _ecsCluster;
    private readonly FargateTaskDefinition _mainApiTaskDef;
    private readonly FargateService _mainApiService;
    private readonly SecurityGroup _mainApiSg;
    private readonly ApplicationLoadBalancer _alb;
    private readonly SecurityGroup _albSg;
    private readonly PrivateDnsNamespace _namespace;
    private readonly FargateTaskDefinition _notificationTaskDef;
    private readonly FargateService _notificationService;
    private readonly SecurityGroup _notificationSg;
    private readonly IQueue _sqsQueue;

    public ContosoStack(Construct scope, string id, IStackProps? props = null)
        : base(scope, id, props)
    {
        // Networking
        _vpc = new Vpc(this, "ContosoVpc", new VpcProps
        {
            MaxAzs = 2,
            NatGateways = 1,
            SubnetConfiguration = new[]
            {
                new SubnetConfiguration
                {
                    Name = "Public",
                    SubnetType = SubnetType.PUBLIC,
                    CidrMask = 24
                },
                new SubnetConfiguration
                {
                    Name = "Private",
                    SubnetType = SubnetType.PRIVATE_WITH_EGRESS,
                    CidrMask = 24
                }
            }
        });

        // Database - Aurora PostgreSQL Serverless v2
        _auroraSg = new SecurityGroup(this, "AuroraSg", new SecurityGroupProps
        {
            Vpc = _vpc,
            Description = "Security group for Aurora PostgreSQL cluster",
            AllowAllOutbound = false
        });

        _auroraCluster = new DatabaseCluster(this, "AuroraCluster", new DatabaseClusterProps
        {
            Engine = DatabaseClusterEngine.AuroraPostgres(new AuroraPostgresClusterEngineProps
            {
                Version = AuroraPostgresEngineVersion.VER_16_4
            }),
            ServerlessV2MinCapacity = 0.5,
            ServerlessV2MaxCapacity = 1,
            Writer = ClusterInstance.ServerlessV2("Writer"),
            Credentials = Credentials.FromGeneratedSecret("clusteradmin"),
            Vpc = _vpc,
            VpcSubnets = new SubnetSelection
            {
                SubnetType = SubnetType.PRIVATE_WITH_EGRESS
            },
            SecurityGroups = new[] { _auroraSg },
            DefaultDatabaseName = "contoso"
        });

        // ECS Cluster
        _ecsCluster = new Amazon.CDK.AWS.ECS.Cluster(this, "EcsCluster", new ClusterProps
        {
            Vpc = _vpc
        });

        // ALB Security Group
        _albSg = new SecurityGroup(this, "AlbSg", new SecurityGroupProps
        {
            Vpc = _vpc,
            Description = "Security group for Application Load Balancer",
            AllowAllOutbound = true
        });
        _albSg.AddIngressRule(Peer.AnyIpv4(), Port.Tcp(80), "Allow HTTP from internet");

        // Main API Security Group - inbound on port 8080 from ALB SG only
        _mainApiSg = new SecurityGroup(this, "MainApiSg", new SecurityGroupProps
        {
            Vpc = _vpc,
            Description = "Security group for Main API Fargate service",
            AllowAllOutbound = true
        });
        _mainApiSg.AddIngressRule(_albSg, Port.Tcp(8080), "Allow HTTP from ALB");

        // Wire Aurora SG to allow inbound from Main API SG on port 5432
        _auroraSg.AddIngressRule(_mainApiSg, Port.Tcp(5432), "Allow PostgreSQL from Main API");

        // Main API Task Definition
        _mainApiTaskDef = new FargateTaskDefinition(this, "MainApiTaskDef", new FargateTaskDefinitionProps
        {
            Cpu = 256,
            MemoryLimitMiB = 512,
            RuntimePlatform = new RuntimePlatform
            {
                CpuArchitecture = CpuArchitecture.ARM64,
                OperatingSystemFamily = OperatingSystemFamily.LINUX
            }
        });

        var mainApiContainer = _mainApiTaskDef.AddContainer("MainApiContainer", new ContainerDefinitionOptions
        {
            Image = ContainerImage.FromAsset("../", new AssetImageProps
            {
                File = "ContosoUniversity-Modernized/Dockerfile"
            }),
            Logging = LogDrivers.AwsLogs(new AwsLogDriverProps
            {
                StreamPrefix = "MainApi"
            })
        });

        mainApiContainer.AddPortMappings(new PortMapping
        {
            ContainerPort = 8080,
            Protocol = Amazon.CDK.AWS.ECS.Protocol.TCP
        });

        // Main API Fargate Service
        _mainApiService = new FargateService(this, "MainApiService", new FargateServiceProps
        {
            Cluster = _ecsCluster,
            TaskDefinition = _mainApiTaskDef,
            DesiredCount = 1,
            VpcSubnets = new SubnetSelection
            {
                SubnetType = SubnetType.PRIVATE_WITH_EGRESS
            },
            SecurityGroups = new[] { _mainApiSg },
            AssignPublicIp = false
        });

        // Application Load Balancer
        _alb = new ApplicationLoadBalancer(this, "MainApiAlb", new ApplicationLoadBalancerProps
        {
            Vpc = _vpc,
            InternetFacing = true,
            VpcSubnets = new SubnetSelection
            {
                SubnetType = SubnetType.PUBLIC
            },
            SecurityGroup = _albSg
        });

        // ALB Target Group
        var targetGroup = new ApplicationTargetGroup(this, "MainApiTargetGroup", new ApplicationTargetGroupProps
        {
            Vpc = _vpc,
            Port = 8080,
            Protocol = ApplicationProtocol.HTTP,
            TargetType = TargetType.IP,
            HealthCheck = new Amazon.CDK.AWS.ElasticLoadBalancingV2.HealthCheck
            {
                Port = "8080",
                Protocol = Amazon.CDK.AWS.ElasticLoadBalancingV2.Protocol.HTTP,
                Path = "/health"
            },
            Targets = new[] { _mainApiService }
        });

        // ALB HTTP Listener on port 80
        _alb.AddListener("HttpListener", new BaseApplicationListenerProps
        {
            Port = 80,
            Protocol = ApplicationProtocol.HTTP,
            DefaultTargetGroups = new[] { targetGroup }
        });

        // Frontend Hosting (S3 + CloudFront with API proxy)
        _frontendBucket = new Bucket(this, "FrontendBucket", new BucketProps
        {
            BlockPublicAccess = BlockPublicAccess.BLOCK_ALL,
            RemovalPolicy = RemovalPolicy.DESTROY,
            AutoDeleteObjects = true
        });

        var albOrigin = new HttpOrigin(_alb.LoadBalancerDnsName, new HttpOriginProps
        {
            ProtocolPolicy = OriginProtocolPolicy.HTTP_ONLY
        });

        _distribution = new Distribution(this, "FrontendDistribution", new DistributionProps
        {
            DefaultBehavior = new BehaviorOptions
            {
                Origin = S3BucketOrigin.WithOriginAccessControl(_frontendBucket)
            },
            AdditionalBehaviors = new Dictionary<string, IBehaviorOptions>
            {
                ["/api/*"] = new BehaviorOptions
                {
                    Origin = albOrigin,
                    AllowedMethods = AllowedMethods.ALLOW_ALL,
                    CachePolicy = CachePolicy.CACHING_DISABLED,
                    OriginRequestPolicy = OriginRequestPolicy.ALL_VIEWER
                },
                ["/health"] = new BehaviorOptions
                {
                    Origin = albOrigin,
                    AllowedMethods = AllowedMethods.ALLOW_ALL,
                    CachePolicy = CachePolicy.CACHING_DISABLED,
                    OriginRequestPolicy = OriginRequestPolicy.ALL_VIEWER
                }
            },
            DefaultRootObject = "index.html",
            ErrorResponses = new[]
            {
                new ErrorResponse
                {
                    HttpStatus = 403,
                    ResponseHttpStatus = 200,
                    ResponsePagePath = "/index.html"
                },
                new ErrorResponse
                {
                    HttpStatus = 404,
                    ResponseHttpStatus = 200,
                    ResponsePagePath = "/index.html"
                }
            }
        });

        // Deploy React SPA to S3 (built at deploy time)
        new BucketDeployment(this, "DeployFrontend", new BucketDeploymentProps
        {
            Sources = new[] { Source.Asset("../ContosoUniversity-Modernized/client-app/dist") },
            DestinationBucket = _frontendBucket,
            Distribution = _distribution,
            DistributionPaths = new[] { "/*" }
        });

        // Cloud Map Private DNS Namespace
        _namespace = new PrivateDnsNamespace(this, "ServiceDiscoveryNamespace", new PrivateDnsNamespaceProps
        {
            Name = "local",
            Vpc = _vpc
        });

        // Notification Service Security Group
        _notificationSg = new SecurityGroup(this, "NotificationSg", new SecurityGroupProps
        {
            Vpc = _vpc,
            Description = "Security group for Notification Service",
            AllowAllOutbound = true
        });
        _notificationSg.AddIngressRule(_mainApiSg, Port.Tcp(5051), "Allow inbound from Main API on port 5051");

        // Notification Service Task Definition
        _notificationTaskDef = new FargateTaskDefinition(this, "NotificationTaskDef", new FargateTaskDefinitionProps
        {
            Cpu = 256,
            MemoryLimitMiB = 512,
            RuntimePlatform = new RuntimePlatform
            {
                CpuArchitecture = CpuArchitecture.ARM64,
                OperatingSystemFamily = OperatingSystemFamily.LINUX
            }
        });

        var notificationContainer = _notificationTaskDef.AddContainer("NotificationContainer", new ContainerDefinitionOptions
        {
            Image = ContainerImage.FromAsset("../", new AssetImageProps
            {
                File = "NotificationService.API/Dockerfile"
            }),
            Logging = LogDrivers.AwsLogs(new AwsLogDriverProps
            {
                StreamPrefix = "NotificationService"
            })
        });

        notificationContainer.AddPortMappings(new PortMapping
        {
            ContainerPort = 5051,
            Protocol = Amazon.CDK.AWS.ECS.Protocol.TCP
        });

        // Notification Fargate Service with Cloud Map registration
        _notificationService = new FargateService(this, "NotificationService", new FargateServiceProps
        {
            Cluster = _ecsCluster,
            TaskDefinition = _notificationTaskDef,
            DesiredCount = 1,
            VpcSubnets = new SubnetSelection
            {
                SubnetType = SubnetType.PRIVATE_WITH_EGRESS
            },
            SecurityGroups = new[] { _notificationSg },
            AssignPublicIp = false,
            CloudMapOptions = new CloudMapOptions
            {
                Name = "notification-service",
                CloudMapNamespace = _namespace,
                DnsRecordType = DnsRecordType.A,
                Container = notificationContainer,
                ContainerPort = 5051
            }
        });

        // Messaging Integration - Import existing SQS queue
        _sqsQueue = Queue.FromQueueAttributes(this, "ContosoNotificationsQueue", new QueueAttributes
        {
            QueueUrl = "https://sqs.us-east-1.amazonaws.com/836548370410/contoso-notifications",
            QueueArn = "arn:aws:sqs:us-east-1:836548370410:contoso-notifications"
        });

        // Environment Variables - Main API
        mainApiContainer.AddEnvironment("AWS__SQS__QueueUrl", _sqsQueue.QueueUrl);
        mainApiContainer.AddEnvironment("NotificationService__BaseUrl", "http://notification-service.local:5051");

        // Environment Variables - Notification Service
        notificationContainer.AddEnvironment("AWS__SQS__QueueUrl", _sqsQueue.QueueUrl);

        // Database connection - construct Npgsql connection string from Aurora cluster details
        mainApiContainer.AddSecret("ConnectionStrings__SchoolContext", Amazon.CDK.AWS.ECS.Secret.FromSecretsManager(_auroraCluster.Secret!));

        // IAM Permissions - Least-privilege task role policies

        // Grant Main API task role read access to Aurora Secrets Manager secret
        _auroraCluster.Secret!.GrantRead(_mainApiTaskDef.TaskRole);

        // Grant Main API task role sqs:SendMessage and sqs:ReceiveMessage on the SQS queue
        _sqsQueue.Grant(_mainApiTaskDef.TaskRole, "sqs:SendMessage", "sqs:ReceiveMessage");

        // Grant Notification Service task role sqs:SendMessage, sqs:ReceiveMessage, and sqs:DeleteMessage on the SQS queue
        _sqsQueue.Grant(_notificationTaskDef.TaskRole, "sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage");

        // Note: Task execution roles (ECR pull + CloudWatch Logs) are automatically
        // provisioned by CDK when using FargateTaskDefinition with container images
        // and AwsLogs log driver. No explicit grants needed.
    }
}
