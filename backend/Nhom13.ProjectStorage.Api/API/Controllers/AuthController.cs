using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nhom13.ProjectStorage.Api.Application.DTOs;
using Nhom13.ProjectStorage.Api.Application.Services;
using Nhom13.ProjectStorage.Api.Domain.Entities;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;
using Nhom13.ProjectStorage.Api.Infrastructure.Repositories;

namespace Nhom13.ProjectStorage.Api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;
    private readonly AppDbContext _context;

    public AuthController(IUnitOfWork uow, IJwtService jwtService, IEmailService emailService, AppDbContext context)
    {
        _uow = uow;
        _jwtService = jwtService;
        _emailService = emailService;
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _uow.Users.GetByEmailWithRoleAsync(request.CompanyEmail);
        if (user == null || !user.IsActive)
            return Unauthorized(new { error = "Invalid credentials." });

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { error = "Invalid credentials." });

        var token = _jwtService.GenerateToken(user);
        return Ok(new LoginResponse(token, user.MustChangePassword));
    }

    [Authorize]
    [HttpPost("change-first-password")]
    public async Task<IActionResult> ChangeFirstPassword([FromBody] ChangePasswordRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null)
            return NotFound(new { error = "User not found." });

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { error = "Current password is incorrect." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.MustChangePassword = false;
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync();

        return Ok(new { message = "Password changed successfully." });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _uow.Users.GetByEmailAsync(request.CompanyEmail);
        // Always return OK to avoid email enumeration
        if (user == null)
            return Ok(new { message = "If that email exists, a reset link has been sent." });

        // Invalidate any existing unused tokens for this user
        var existingTokens = await _context.PasswordResetTokens
            .Where(t => t.UserId == user.UserId && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
        foreach (var t in existingTokens)
            t.IsUsed = true;

        var rawToken = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(48));
        var resetToken = new PasswordResetToken
        {
            UserId = user.UserId,
            Token = rawToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync();

        var resetLink = $"https://yourapp.example.com/reset-password?token={Uri.EscapeDataString(rawToken)}";
        var html = $"<p>Hello,</p><p>Click the link below to reset your password (valid for 1 hour):</p><p><a href='{resetLink}'>{resetLink}</a></p>";

        await _emailService.SendAsync(user.CompanyEmail, "Password Reset Request", html);

        return Ok(new { message = "If that email exists, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var resetToken = await _context.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == request.Token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

        if (resetToken == null)
            return BadRequest(new { error = "Invalid or expired reset token." });

        resetToken.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        resetToken.User.MustChangePassword = false;
        resetToken.IsUsed = true;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Password has been reset successfully." });
    }
}

