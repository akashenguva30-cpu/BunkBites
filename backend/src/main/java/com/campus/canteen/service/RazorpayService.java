package com.campus.canteen.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.annotation.PostConstruct;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class RazorpayService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    private RazorpayClient razorpayClient;

    @PostConstruct
    public void init() {
        if (keyId == null || keyId.trim().isEmpty() || keyId.equals("rzp_test_your_key_id") ||
            keySecret == null || keySecret.trim().isEmpty() || keySecret.equals("your_test_key_secret")) {
            throw new IllegalStateException("Razorpay credentials are not configured properly. Please check your .env or application.properties file.");
        }

        try {
            this.razorpayClient = new RazorpayClient(keyId, keySecret);
        } catch (RazorpayException e) {
            throw new IllegalStateException("Failed to initialize Razorpay Client: " + e.getMessage(), e);
        }
    }

    public RazorpayClient getClient() {
        return this.razorpayClient;
    }

    public String getKeyId() {
        return this.keyId;
    }

    public Order createRazorpayOrder(long amountInPaise, String receipt) throws RazorpayException {
        JSONObject options = new JSONObject();
        options.put("amount", amountInPaise);
        options.put("currency", "INR");
        options.put("receipt", receipt);

        return razorpayClient.orders.create(options);
    }

    public boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", razorpayOrderId);
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", razorpaySignature);
            return com.razorpay.Utils.verifyPaymentSignature(options, keySecret);
        } catch (Exception e) {
            return false;
        }
    }
}
