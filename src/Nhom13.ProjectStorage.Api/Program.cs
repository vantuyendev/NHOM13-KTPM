using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Nhom13.ProjectStorage.Api.API.Hubs;
using Nhom13.ProjectStorage.Api.API.Middleware;
using Nhom13.ProjectStorage.Api.Application.Services;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;
using Nhom13.ProjectStorage.Api.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// ---- Database ----
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ---- Repositories & UoW ----
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();

// ---- Application Services ----
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// ---- JWT Authentication ----
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };

    // Allow SignalR to receive JWT from query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                context.Token = accessToken;
            return System.Threading.Tasks.Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ---- SignalR ----
builder.Services.AddSignalR();

// ---- Controllers ----
builder.Services.AddControllers();

var app = builder.Build();

// ---- Middleware Pipeline ----
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<MustChangePasswordMiddleware>();

app.MapControllers();

// ---- SignalR Hub Endpoint ----
app.MapHub<TaskHub>("/hubs/tasks");

app.Run();

