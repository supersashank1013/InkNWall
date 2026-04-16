package com.inknwall.backend;

import com.inknwall.backend.entity.Admin;
import com.inknwall.backend.repository.AdminRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	CommandLineRunner initAdmins(AdminRepository repo, BCryptPasswordEncoder encoder) {
		return args -> {

			if (repo.count() == 0) {

				Admin a1 = new Admin();
				a1.setEmail("TS-sashank");
				a1.setPassword(encoder.encode("tonystarkmark42"));

				Admin a2 = new Admin();
				a2.setEmail("Marvelmax");
				a2.setPassword(encoder.encode("marvel123"));

				Admin a3 = new Admin();
				a3.setEmail("GridVelocity");
				a3.setPassword(encoder.encode("Velocity123"));

				Admin a4 = new Admin();
				a4.setEmail("notTanishqGamer");
				a4.setPassword(encoder.encode("Gamerz123."));

				repo.save(a1);
				repo.save(a2);
				repo.save(a3);
				repo.save(a4);

				System.out.println("Admins created successfully 🚀");
			}
		};
	}

}
