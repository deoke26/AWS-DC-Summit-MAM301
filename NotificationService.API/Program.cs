using Amazon;
using Amazon.SQS;
using Newtonsoft.Json.Converters;
using NotificationService.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Register IAmazonSQS as singleton using region from configuration
builder.Services.AddSingleton<IAmazonSQS>(sp =>
    new AmazonSQSClient(RegionEndpoint.GetBySystemName(builder.Configuration["AWS:Region"])));

// Register SQS notification service
builder.Services.AddScoped<ISqsNotificationService, SqsNotificationService>();

// Add controllers with Newtonsoft.Json and StringEnumConverter
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.Converters.Add(new StringEnumConverter());
    });

// Disable automatic 400 response for model validation so controller can return custom format
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

var app = builder.Build();

app.MapControllers();

app.Run();
