using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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

        // Notification service DI registration
        builder.Services.AddScoped<INotificationService, NotificationService>();

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
