    package com.inknwall.backend.security;

    import com.inknwall.backend.util.JwtUtil;
    import jakarta.servlet.FilterChain;
    import jakarta.servlet.ServletException;
    import jakarta.servlet.http.HttpServletRequest;
    import jakarta.servlet.http.HttpServletResponse;
    import lombok.RequiredArgsConstructor;
    import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
    import org.springframework.security.core.context.SecurityContextHolder;
    import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
    import org.springframework.stereotype.Component;
    import org.springframework.web.filter.OncePerRequestFilter;
    import org.springframework.security.core.authority.SimpleGrantedAuthority;
    import java.util.List;
    import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
    import org.springframework.security.core.context.SecurityContextHolder;
    import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
    import java.util.ArrayList;

    import java.io.IOException;
    import java.util.Collections;

    @Component
    @RequiredArgsConstructor
    public class JwtFilter extends OncePerRequestFilter {

        private final JwtUtil jwtUtil;

        @Override
        protected boolean shouldNotFilter(HttpServletRequest request) {
            return request.getMethod().equals("DELETE");
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain filterChain)
                throws ServletException, IOException {

            String authHeader = request.getHeader("Authorization");
            System.out.println("AUTH HEADER: " + authHeader);

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                System.out.println("JWT TOKEN: " + token);

                try {
                    String email = jwtUtil.extractEmail(token);
                    System.out.println("EMAIL FROM TOKEN: " + email);

                    if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        email,
                                        null,
                                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
//                                        null
                                );

                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }

                } catch (Exception e) {
                    System.out.println("JWT ERROR: " + e.getMessage());
                }
            }

            filterChain.doFilter(request, response);
        }
    }
