package com.campus.canteen.dto;

public class PopularItemDTO {
    private String name;
    private Long quantityOrdered;

    public PopularItemDTO() {}

    public PopularItemDTO(String name, Long quantityOrdered) {
        this.name = name;
        this.quantityOrdered = quantityOrdered;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getQuantityOrdered() { return quantityOrdered; }
    public void setQuantityOrdered(Long quantityOrdered) { this.quantityOrdered = quantityOrdered; }
}
