using System;
using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Amazon;
using Amazon.SQS;
using ContosoUniversity.Data;
using ContosoUniversity.Services;

namespace ContosoUniversity;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Configure Kestrel request body size limit
        builder.WebHost.ConfigureKestrel(options =>
        {
            options.Limits.MaxRequestBodySize = 10485760; // 10 MB
        });

        // Add services to the container.
        builder.Services.AddControllers();

        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
            });
        });

        builder.Services.AddAuthorization();

        // Entity Framework Core - SchoolContext
        builder.Services.AddDbContext<SchoolContext>(options =>
            options.UseNpgsql(GetConnectionString(builder.Configuration)));

        static string GetConnectionString(IConfiguration config)
        {
            // Check if Aurora secret JSON is injected (ECS production)
            var secretJson = config["ConnectionStrings:SchoolContext"];
            if (!string.IsNullOrEmpty(secretJson) && secretJson.TrimStart().StartsWith("{"))
            {
                var secret = System.Text.Json.JsonDocument.Parse(secretJson).RootElement;
                var host = secret.GetProperty("host").GetString();
                var port = secret.GetProperty("port").GetInt32();
                var username = secret.GetProperty("username").GetString();
                var password = secret.GetProperty("password").GetString();
                // Aurora secrets may use "dbname" or "dbClusterIdentifier"; fall back to "contoso"
                var dbname = secret.TryGetProperty("dbname", out var dbnameEl)
                    ? dbnameEl.GetString()
                    : "contoso";
                return $"Host={host};Port={port};Database={dbname};Username={username};Password={password}";
            }
            // Local development - use connection string as-is
            return secretJson ?? config.GetConnectionString("SchoolContext") ?? "";
        }

        // SQS client as singleton
        builder.Services.AddSingleton<IAmazonSQS>(sp => new AmazonSQSClient(RegionEndpoint.USEast1));

        // Notification service DI registration
        builder.Services.AddScoped<INotificationService, SqsNotificationService>();

        // Typed HttpClient for notification microservice
        builder.Services.AddHttpClient<INotificationClient, NotificationClient>(client =>
        {
            var baseUrl = builder.Configuration["NotificationService:BaseUrl"] ?? "http://localhost:5051";
            client.BaseAddress = new Uri(baseUrl);
            client.Timeout = TimeSpan.FromSeconds(5);
        });

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }
        else
        {
            app.UseExceptionHandler("/error");
            app.UseHsts();
        }

        if (!app.Environment.IsDevelopment())
        {
            // HTTPS is terminated at CloudFront; ALB traffic is HTTP
        }

        // Serve static files from wwwroot (React SPA build output)
        app.UseStaticFiles();

        // Serve uploaded teaching materials
        var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "Uploads");
        if (Directory.Exists(uploadsPath))
        {
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(uploadsPath),
                RequestPath = "/Uploads"
            });
        }

        app.UseRouting();
        app.UseCors();
        app.UseAuthorization();

        // Map API controllers
        app.MapControllers();

        // SPA fallback: serve index.html for all non-API, non-file routes
        app.MapFallbackToFile("index.html");

        app.MapGet("/health", () => Microsoft.AspNetCore.Http.Results.Ok("healthy"));

        // Seed database on startup
        using (var scope = app.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SchoolContext>();
            DbInitializer.Initialize(context);
        }

        app.Run();
    }
}
