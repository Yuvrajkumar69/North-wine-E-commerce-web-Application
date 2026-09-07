package com.genie.Ecomm.service;

import com.genie.Ecomm.dto.WishlistDTO;
import com.genie.Ecomm.exception.ResourceNotFoundException;
import com.genie.Ecomm.model.Product;
import com.genie.Ecomm.model.User;
import com.genie.Ecomm.model.WishlistItem;
import com.genie.Ecomm.repo.ProductRepository;
import com.genie.Ecomm.repo.UserRepository;
import com.genie.Ecomm.repo.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    public WishlistDTO addToWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));

        if (wishlistRepository.existsByUserAndProduct(user, product)) {
            WishlistItem item = wishlistRepository.findByUserAndProduct(user, product).get();
            return convertToDTO(item);
        }

        WishlistItem item = new WishlistItem();
        item.setUser(user);
        item.setProduct(product);
        item.setAddedAt(new Date());

        WishlistItem saved = wishlistRepository.save(item);
        return convertToDTO(saved);
    }

    public void removeFromWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));

        wishlistRepository.deleteByUserAndProduct(user, product);
    }

    public List<WishlistDTO> getWishlist(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

        List<WishlistItem> items = wishlistRepository.findByUser(user);
        return items.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public boolean isInWishlist(Long userId, Long productId) {
        User user = userRepository.findById(userId).orElse(null);
        Product product = productRepository.findById(productId).orElse(null);
        if (user == null || product == null) {
            return false;
        }
        return wishlistRepository.existsByUserAndProduct(user, product);
    }

    private WishlistDTO convertToDTO(WishlistItem item) {
        Product p = item.getProduct();
        return new WishlistDTO(
                item.getId(),
                p.getId(),
                p.getName(),
                p.getPrice(),
                p.getImageUrl(),
                p.getCategory()
        );
    }
}
