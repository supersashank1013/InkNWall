package com.inknwall.backend.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    public record EmailResult(boolean sent, String message) {}

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${mail.from:onboarding@resend.dev}")
    private String fromEmail;

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
        if (resendApiKey == null || resendApiKey.isBlank()) {
            return new EmailResult(false, "Email skipped: RESEND_API_KEY not configured");
        }

        try {
            Resend resend = new Resend(resendApiKey);

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from("InkNWall <" + fromEmail + ">")
                    .to(to)
                    .subject(subject)
                    .html(htmlBody)
                    .build();

            CreateEmailResponse response = resend.emails().send(params);
            return new EmailResult(true, "Email sent to " + to + " | id: " + response.getId());

        } catch (ResendException e) {
            return new EmailResult(false, "Email failed for " + to + ": " + e.getMessage());
        }
    }
}
