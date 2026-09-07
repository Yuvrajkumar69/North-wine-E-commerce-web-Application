package com.genie.Ecomm.service;

import com.genie.Ecomm.exception.DuplicateResourceException;
import com.genie.Ecomm.exception.InvalidCredentialsException;
import com.genie.Ecomm.model.User;
import com.genie.Ecomm.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public User registerUser(User user) {
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new DuplicateResourceException("An account with this email already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User loginUser(String email, String password) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        boolean matches = passwordEncoder.matches(password, user.getPassword());
        if (!matches && user.getPassword().equals(password)) {
            // Upgrade plaintext password to BCrypt hash transparently
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);
            matches = true;
        }

        if (!matches) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        return user;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
