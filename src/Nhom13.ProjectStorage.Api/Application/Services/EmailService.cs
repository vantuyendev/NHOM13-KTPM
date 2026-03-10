using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Nhom13.ProjectStorage.Api.Application.Services;

public interface IEmailService
{
    System.Threading.Tasks.Task SendAsync(string toEmail, string subject, string htmlBody);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        var smtpSettings = _config.GetSection("SmtpSettings");
        var host = smtpSettings["Host"]!;
        var port = int.Parse(smtpSettings["Port"]!);
        var senderEmail = smtpSettings["SenderEmail"]!;
        var senderName = smtpSettings["SenderName"] ?? "Nhom13 System";
        var username = smtpSettings["Username"]!;
        var password = smtpSettings["Password"]!;
        var useSsl = bool.Parse(smtpSettings["UseSsl"] ?? "false");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(senderName, senderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        var secureOption = useSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;

        try
        {
            await client.ConnectAsync(host, port, secureOption);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            // Log and swallow so API doesn't fail; in production wire up a proper retry
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }
}
