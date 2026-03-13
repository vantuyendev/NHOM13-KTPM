using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Nhom13.ProjectStorage.Api.API.Hubs;
using Nhom13.ProjectStorage.Api.API.Middleware;
using Nhom13.ProjectStorage.Api.Application.Services;
using Nhom13.ProjectStorage.Api.Domain.Entities;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;
using Nhom13.ProjectStorage.Api.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// ---- Database ----
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(connectionString) && connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlite(connectionString);
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// ---- Repositories & UoW ----
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();

// ---- Application Services ----
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// ---- JWT Authentication ----
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]
    ?? builder.Configuration["JWT_SECRET"]
    ?? throw new InvalidOperationException("JWT secret key is missing. Configure JwtSettings:SecretKey or JWT_SECRET.");

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

// ---- CORS ----
var corsAllowedOrigins = builder.Configuration["CORS_ALLOWED_ORIGINS"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy =>
    {
        if (string.IsNullOrWhiteSpace(corsAllowedOrigins))
        {
            // Safe for this project because auth is JWT bearer (no cookie credentials).
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
        else
        {
            var origins = corsAllowedOrigins
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
        }
    });
});

// ---- SignalR ----
builder.Services.AddSignalR();

// ---- Controllers ----
builder.Services.AddControllers();

var app = builder.Build();

// ---- Middleware Pipeline ----
app.UseMiddleware<GlobalExceptionMiddleware>();

// Trust proxy headers on platforms like Render/NGINX so scheme/remote IP are resolved correctly.
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

var enableHttpsRedirect = builder.Configuration.GetValue("EnableHttpsRedirection", false);
if (enableHttpsRedirect)
{
    app.UseHttpsRedirection();
}
app.UseCors("AppCors");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<MustChangePasswordMiddleware>();

// ---- DB init + seed for local development ----
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();

    if (!await db.Roles.AnyAsync())
    {
        db.Roles.AddRange(
            new Role { RoleId = 1, RoleName = "Manager" },
            new Role { RoleId = 2, RoleName = "Member" }
        );
        await db.SaveChangesAsync();
    }

    Department department;
    if (!await db.Departments.AnyAsync())
    {
        department = new Department
        {
            Name = "Engineering",
            Description = "Default department for local development"
        };
        db.Departments.Add(department);
        await db.SaveChangesAsync();
    }
    else
    {
        department = await db.Departments.OrderBy(d => d.DepartmentId).FirstAsync();
    }

    if (!await db.Users.AnyAsync(u => u.CompanyEmail == "manager@company.com"))
    {
        db.Users.Add(new User
        {
            SystemUserId = "MGR001",
            CompanyEmail = "manager@company.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"),
            RoleId = 1,
            DepartmentId = department.DepartmentId,
            MustChangePassword = false,
            IsActive = true
        });
    }

    if (!await db.Users.AnyAsync(u => u.CompanyEmail == "member@company.com"))
    {
        db.Users.Add(new User
        {
            SystemUserId = "MEM001",
            CompanyEmail = "member@company.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Member@123"),
            RoleId = 2,
            DepartmentId = department.DepartmentId,
            MustChangePassword = false,
            IsActive = true
        });
    }

    await db.SaveChangesAsync();
}

app.MapControllers();

// Health and root endpoints for container probes / quick checks.
app.MapGet("/", () => Results.Ok(new { status = "ok", service = "Nhom13.ProjectStorage.Api" }));
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

// ---- SignalR Hub Endpoint ----
app.MapHub<TaskHub>("/hubs/tasks");

app.Run();

