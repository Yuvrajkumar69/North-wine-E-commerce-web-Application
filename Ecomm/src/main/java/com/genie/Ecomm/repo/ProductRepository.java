package com.genie.Ecomm.repo;

import com.genie.Ecomm.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategoryIgnoreCase(String category);

    List<Product> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String nameKeyword, String descKeyword);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL AND p.category <> ''")
    List<String> findDistinctCategories();
}
