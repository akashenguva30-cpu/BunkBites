import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckOrphans {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/smart_canteen";
        String user = "postgres";
        String password = System.getenv("DB_PASSWORD");
        
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            ResultSet rs = stmt.executeQuery("SELECT id FROM orders WHERE id NOT IN (SELECT order_id FROM payments)");
            System.out.println("Orphan orders (no payment):");
            while (rs.next()) {
                System.out.println("Order ID: " + rs.getLong(1));
            }
            
            rs = stmt.executeQuery("SELECT id FROM orders WHERE id NOT IN (SELECT order_id FROM tokens)");
            System.out.println("Orphan orders (no token):");
            while (rs.next()) {
                System.out.println("Order ID: " + rs.getLong(1));
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
