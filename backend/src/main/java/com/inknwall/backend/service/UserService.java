package com.inknwall.backend.service;

import com.inknwall.backend.entity.User;
import com.inknwall.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repo;
    private final BCryptPasswordEncoder encoder;

    public User googleLogin(User incomingUser) {

        Optional<User> existing = repo.findByEmail(incomingUser.getEmail());

        if (existing.isPresent()) {
            User user = existing.get();

            if (user.getProfilePic() == null || user.getProfilePic().isBlank()) {
                user.setProfilePic(incomingUser.getProfilePic());
                return repo.save(user);
            }

            return user;
        }

        // New User -> save minimal info first
        return repo.save(incomingUser);
    }

    public User updateUser(Long id, User updated) {
        User user = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        user.setHostel(updated.getHostel());
        user.setPhone(updated.getPhone());

        if (updated.getProfilePic() != null && !updated.getProfilePic().isBlank()) {
            user.setProfilePic(updated.getProfilePic());  // ⭐ FIX
        }

        return repo.save(user);
    }
}
