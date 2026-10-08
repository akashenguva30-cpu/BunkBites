package com.campus.canteen;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

public class TestJwtSecret {
    public static void main(String[] args) {
        String jwtSecret = "======================canteen=secret=key=1234567890======================";
        try {
            byte[] bytes = Decoders.BASE64.decode(jwtSecret);
            System.out.println("Decoded bytes length: " + bytes.length);
            SecretKey key = Keys.hmacShaKeyFor(bytes);
            System.out.println("Key generated successfully! Algorithm: " + key.getAlgorithm());
            String token = Jwts.builder().subject("test").signWith(key).compact();
            System.out.println("Token generated: " + token);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
