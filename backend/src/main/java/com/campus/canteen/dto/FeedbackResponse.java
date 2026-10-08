package com.campus.canteen.dto;

import com.campus.canteen.model.Feedback;

import java.time.LocalDateTime;

public class FeedbackResponse {
    private Long id;
    private Long orderId;
    private Long userId;
    private String username;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    public FeedbackResponse(Feedback feedback) {
        this.id = feedback.getId();
        this.orderId = feedback.getOrder().getId();
        this.userId = feedback.getUser().getId();
        this.username = feedback.getUser().getUsername();
        this.rating = feedback.getRating();
        this.comment = feedback.getComment();
        this.createdAt = feedback.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
