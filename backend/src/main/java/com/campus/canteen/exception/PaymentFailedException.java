package com.campus.canteen.exception;

public class PaymentFailedException extends RuntimeException {
    private final String transactionReference;

    public PaymentFailedException(String message, String transactionReference) {
        super(message);
        this.transactionReference = transactionReference;
    }

    public String getTransactionReference() {
        return transactionReference;
    }
}
