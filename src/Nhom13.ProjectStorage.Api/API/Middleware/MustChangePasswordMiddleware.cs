using System.Security.Claims;

namespace Nhom13.ProjectStorage.Api.API.Middleware;

public class MustChangePasswordMiddleware
{
    private readonly RequestDelegate _next;

    public MustChangePasswordMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var mustChange = context.User.FindFirstValue("MustChangePassword");
            if (mustChange == "True")
            {
                var path = context.Request.Path.Value ?? string.Empty;
                // Only allow the change-password endpoint when MustChangePassword is true
                if (!path.EndsWith("/auth/change-first-password", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.ContentType = "application/json";
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsync("{\"error\":\"You must change your password before accessing this resource.\"}");
                    return;
                }
            }
        }

        await _next(context);
    }
}
