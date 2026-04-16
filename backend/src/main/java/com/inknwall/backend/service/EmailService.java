package com.inknwall.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;

@Service
public class EmailService {

    public void sendEmail(String to, String subject, String htmlBody) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

        if (mailSender == null) {
            System.err.println("Mail sender not configured");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setCc("inknwall@gmail.com");
            helper.setSubject(subject);

            // ✅ HTML enabled
            helper.setText(htmlBody, true);

            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom("InkNWall <" + fromEmail + ">");
            }

            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("Email failed: " + e.getMessage());
        }
    }


    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

}
