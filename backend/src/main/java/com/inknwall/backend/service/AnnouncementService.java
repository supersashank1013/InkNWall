package com.inknwall.backend.service;

import com.inknwall.backend.entity.Announcement;
import com.inknwall.backend.entity.Poster;
import com.inknwall.backend.repository.AnnouncementRepository;
import com.inknwall.backend.repository.PosterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final PosterRepository posterRepository;

    public Announcement create(String message, Long posterId) {

        Announcement a = new Announcement();
        a.setMessage(message);

        if (posterId != null) {
            posterRepository.findById(posterId)
                    .ifPresent(a::setPoster); // no crash
        }
        return announcementRepository.save(a);
    }

    public List<Announcement> getAll() {
        return announcementRepository.findAll();
    }
    public void deleteAnnouncement(Long id) {
        if (!announcementRepository.existsById(id)) {
            throw new RuntimeException("Announcement not found");
        }
        announcementRepository.deleteById(id);
    }
}