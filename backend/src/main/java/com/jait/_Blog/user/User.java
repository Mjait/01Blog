package com.jait._Blog.user;

import java.time.Instant;
import java.util.UUID;

public class User {
    private UUID id;
    private String username;
    private String email;
    private String hashedPassword;
    private Instant createdAt;

    public User(UUID id, String username, String email, String hashedPassword, Instant createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.hashedPassword = hashedPassword;
        this.createdAt = createdAt;

    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getHashedPassword() {
        return  hashedPassword;
    }

    public void setHashedPassword(String hashedPassword) {
        this.hashedPassword = hashedPassword;
    }

}