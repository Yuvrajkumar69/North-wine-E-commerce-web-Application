package com.genie.Ecomm.controller;

import com.genie.Ecomm.dto.WishlistDTO;
import com.genie.Ecomm.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/wishlist")
@CrossOrigin("*")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @GetMapping("/{userId}")
    public List<WishlistDTO> getWishlist(@PathVariable("userId") Long userId) {
        return wishlistService.getWishlist(userId);
    }

    @PostMapping("/{userId}/add/{productId}")
    public WishlistDTO addToWishlist(@PathVariable("userId") Long userId, @PathVariable("productId") Long productId) {
        return wishlistService.addToWishlist(userId, productId);
    }

    @DeleteMapping("/{userId}/remove/{productId}")
    public ResponseEntity<Map<String, String>> removeFromWishlist(@PathVariable("userId") Long userId, @PathVariable("productId") Long productId) {
        wishlistService.removeFromWishlist(userId, productId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Item removed from wishlist successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}/check/{productId}")
    public ResponseEntity<Map<String, Boolean>> isInWishlist(@PathVariable("userId") Long userId, @PathVariable("productId") Long productId) {
        boolean inWishlist = wishlistService.isInWishlist(userId, productId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("inWishlist", inWishlist);
        return ResponseEntity.ok(response);
    }
}
