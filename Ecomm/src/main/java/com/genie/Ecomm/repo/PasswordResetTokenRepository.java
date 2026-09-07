package com.genie.Ecomm.repo;

import com.genie.Ecomm.model.PasswordResetToken;
import com.genie.Ecomm.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    List<PasswordResetToken> findAllByUser(User user);

    @Transactional
    void deleteByUser(User user);
}
