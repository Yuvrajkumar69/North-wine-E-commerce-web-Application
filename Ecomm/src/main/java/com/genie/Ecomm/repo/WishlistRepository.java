package com.genie.Ecomm.repo;

import com.genie.Ecomm.model.Product;
import com.genie.Ecomm.model.User;
import com.genie.Ecomm.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {

    List<WishlistItem> findByUser(User user);

    Optional<WishlistItem> findByUserAndProduct(User user, Product product);

    boolean existsByUserAndProduct(User user, Product product);

    @Transactional
    void deleteByUserAndProduct(User user, Product product);
}
