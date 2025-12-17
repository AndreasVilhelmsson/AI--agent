using backend.Api.Hubs;
using backend.Application.Services;
using backend.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// MVC / Controllers
builder.Services.AddControllers();

// Realtime
builder.Services.AddSignalR();

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();

// OpenAI / HttpClient
builder.Services.AddHttpClient<AnalysisService>();

// EF Core + SQLite
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? "Data Source=ai_meetings.db";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite(connectionString);
});

// CORS: frontend kör på http://localhost:5173
builder.Services.AddCors(o =>
    o.AddDefaultPolicy(p =>
        p.WithOrigins("http://localhost:5173")
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()
    ));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// I dev: hoppa över HTTPS-redirect för att slippa strul med ws/http
// app.UseHttpsRedirection();

app.UseCors();

app.MapControllers();
app.MapHub<MeetingHub>("/hubs/meeting");

// Demo-weather (kan vara kvar eller tas bort)
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy",
    "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}