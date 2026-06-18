using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
        builder.Services.AddControllersWithViews();

        builder.Services.AddAuthorization();

        // Entity Framework Core - SchoolContext
        builder.Services.AddDbContext<SchoolContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("SchoolContext")));

        // SQS client as singleton
        builder.Services.AddSingleton<IAmazonSQS>(sp => new AmazonSQSClient(RegionEndpoint.USEast1));

        // Notification service DI registration
        builder.Services.AddScoped<INotificationService, SqsNotificationService>();

        // Typed HttpClient for notification microservice
        builder.Services.AddHttpClient<INotificationClient, NotificationClient>(client =>
        {
            client.BaseAddress = new Uri("http://localhost:5051");
            client.Timeout = TimeSpan.FromSeconds(5);
        });

        // Bundling/minification via LigerShark WebOptimizer
        builder.Services.AddWebOptimizer();

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }
        else
        {
            app.UseExceptionHandler("/Home/Error");
            app.UseHsts();
        }

        if (!app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
        }
        app.UseWebOptimizer();
        app.UseStaticFiles();
        app.UseRouting();
        app.UseAuthorization();

        app.MapControllerRoute(
            name: "default",
            pattern: "{controller=Home}/{action=Index}/{id?}");

        app.Run();
    }
}
