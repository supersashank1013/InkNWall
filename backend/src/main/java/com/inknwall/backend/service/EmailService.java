package com.inknwall.backend.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    public record EmailResult(boolean sent, String message) {}

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    @Async("mailTaskExecutor")
    public void sendEmail(String to, String subject, String htmlBody) {
        EmailResult result = sendEmailNow(to, subject, htmlBody);
        if (result.sent()) {
            System.out.println(result.message());
        } else {
            System.err.println(result.message());
        }
    }

    public EmailResult sendEmailNow(String to, String subject, String htmlBody) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

        if (fromEmail == null || fromEmail.isBlank() || mailPassword == null || mailPassword.isBlank()) {
            return new EmailResult(false, "Email skipped: MAIL_USERNAME or MAIL_PASSWORD is not configured");
        }

        if (mailSender == null) {
            return new EmailResult(false, "Email skipped: mail sender is not configured");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setBcc(fromEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            helper.setFrom(fromEmail, "InkNWall");

            mailSender.send(message);
            return new EmailResult(true, "Email sent to " + to);
        } catch (Exception e) {
            Throwable root = e;
            while (root.getCause() != null) {
                root = root.getCause();
            }
            return new EmailResult(false, "Email failed for " + to + ": " + root.getMessage());
        }
    }
}
