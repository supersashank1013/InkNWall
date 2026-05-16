package com.inknwall.backend.config;

import com.inknwall.backend.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.Customizer;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth

                        // Preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public Auth
                        .requestMatchers("/api/users/register").permitAll()
                        .requestMatchers("/api/users/login").permitAll()
                        .requestMatchers("/api/users/google-login").permitAll()
                        .requestMatchers("/api/admin/login").permitAll()

                        // Public Content
                        .requestMatchers(HttpMethod.GET, "/api/announcement/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posters/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/posters/**").authenticated()

                        // Protected
                        .requestMatchers("/api/orders/**").authenticated()
                        .requestMatchers("/api/payment/**").authenticated()
                        .requestMatchers("/api/posters/upload").authenticated()
                        .requestMatchers("/api/admin/**").authenticated()

                        // everything else protected
                        .anyRequest().authenticated()

//                        .requestMatchers("/api/users/**").permitAll()
//                        .requestMatchers("/api/orders/**").permitAll()
//                        .requestMatchers("/api/posters/**").permitAll()
//                        .requestMatchers("/api/admin/**").permitAll()
//                        .requestMatchers("/api/announcement/**").permitAll()
//                        .requestMatchers(HttpMethod.POST, "/api/announcement").permitAll()
//                        .requestMatchers("/api/posters/upload").authenticated()
//                        .requestMatchers("/api/users/**").authenticated()
//                        .requestMatchers("/api/orders/my").authenticated()
//                        .requestMatchers("/api/admin/logs").authenticated()

                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable());

        return http.build();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
