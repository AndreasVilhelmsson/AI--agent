using backend.Api.Hubs;
using backend.Application.Services;
using backend.Infrastructure;
using Microsoft.EntityFrameworkCore;

try
{
    Console.WriteLine("BOOT: Program started");

    var builder = WebApplication.CreateBuilder(args);

    builder.Services.AddControllers();
    builder.Services.AddSignalR();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    builder.Services.AddHttpClient<AnalysisService>();
    builder.Services.AddHttpClient<TranscriptionService>();

    var connectionString =
        builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=/home/ai_meetings.db";

    builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(connectionString));

    var frontendUrl = builder.Configuration["FRONTEND_URL"];

    builder.Services.AddCors(o =>
        o.AddDefaultPolicy(p =>
        {
            if (!string.IsNullOrWhiteSpace(frontendUrl))
            {
                p.WithOrigins(frontendUrl);
            }
            else
            {
                p.WithOrigins("http://localhost:5173", "https://localhost:5173");
            }

            p.AllowAnyHeader()
             .AllowAnyMethod()
             .AllowCredentials();
        }));

    var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

    var app = builder.Build();
    Console.WriteLine("BOOT: app built");

    app.MapGet("/healthz", () => Results.Ok("ok"));

    // OBS: På Azure är det nästan alltid Production → den här körs inte
    if (app.Environment.IsDevelopment())
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
    }

    if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseCors();

    app.MapControllers();
    app.MapHub<MeetingHub>("/hubs/meeting");

    Console.WriteLine("BOOT: about to run");
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine("FATAL STARTUP ERROR:");
    Console.WriteLine(ex.ToString());
    throw;
}