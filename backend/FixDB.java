import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.sql.ResultSet;

public class FixDB {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/smart_canteen";
        String user = "postgres";
        String password = System.getenv("DB_PASSWORD");
        
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            ResultSet rs = stmt.executeQuery("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'payments_method_check'");
            if (rs.next()) {
                System.out.println("Old constraint: " + rs.getString(1));
            } else {
                System.out.println("Constraint payments_method_check not found.");
            }
            
            System.out.println("Dropping constraint...");
            stmt.execute("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check");
            
            System.out.println("Adding new constraint...");
            stmt.execute("ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (method::text = ANY (ARRAY['UPI'::character varying, 'CARD'::character varying, 'CASH'::character varying, 'WALLET'::character varying, 'NET_BANKING'::character varying]::text[]))");
            
            System.out.println("Successfully updated constraint.");
            
            rs = stmt.executeQuery("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'payments_method_check'");
            if (rs.next()) {
                System.out.println("New constraint: " + rs.getString(1));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
