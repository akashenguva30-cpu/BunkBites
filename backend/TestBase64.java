import java.util.Base64;
public class TestBase64 {
    public static void main(String[] args) {
        String secret = "======================canteen=secret=key=1234567890======================";
        try {
            byte[] decoded = Base64.getDecoder().decode(secret);
            System.out.println("Standard Base64 length: " + decoded.length);
        } catch (Exception e) {
            System.out.println("Standard Base64 failed: " + e.getMessage());
        }
        
        try {
            // JJWT Decoders.BASE64 is somewhat similar to MIME or URL decoder if it ignores invalid chars
            byte[] mimeDecoded = Base64.getMimeDecoder().decode(secret);
            System.out.println("MIME Base64 length: " + mimeDecoded.length);
        } catch (Exception e) {
            System.out.println("MIME Base64 failed: " + e.getMessage());
        }
    }
}
