package com.inknwall.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.inknwall.backend.entity.AdminLog;
import com.inknwall.backend.entity.Poster;
import com.inknwall.backend.repository.AdminLogRepository;
import com.inknwall.backend.repository.PosterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PosterService {

    private final Cloudinary cloudinary;
    private final PosterRepository posterRepository;
    private final AdminLogRepository adminLogRepository;

    public Poster uploadPoster(String name, String category, Double price, MultipartFile file, boolean isPremium) {
        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());

            String imageUrl = uploadResult.get("secure_url").toString();

            Poster poster = Poster.builder()
                    .name(name)
                    .category(category)
                    .price(price)
                    .imageUrl(imageUrl)
                    .build();

            poster.setPremium(isPremium);

            Poster savedPoster = posterRepository.save(poster);

            // ✅ GET ADMIN EMAIL FROM JWT
            String email = org.springframework.security.core.context.SecurityContextHolder
                    .getContext()
                    .getAuthentication()
                    .getName();

            // ✅ LOG
            AdminLog log = new AdminLog();
            log.setAdminEmail(email);
            log.setAction("UPLOAD");
            log.setDetails("Uploaded poster: " + savedPoster.getName());
            log.setTimestamp(LocalDateTime.now());

            adminLogRepository.save(log);

            return savedPoster;

        } catch (Exception e) {
            throw new RuntimeException("Image upload failed");
        }
    }
    public List<Poster> getAllPosters() {
        return posterRepository.findAll();
    }
    public void deletePoster(Long id) {
        posterRepository.deleteById(id);
    }
}