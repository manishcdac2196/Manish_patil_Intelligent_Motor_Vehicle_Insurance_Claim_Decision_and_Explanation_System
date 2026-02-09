import psycopg2
import sys

# Default credentials from start-project.ps1
DB_CONFIG = {
    "dbname": "motor_insurance_db",
    "user": "postgres",
    "password": "password", # trying default first, then user provided
    "host": "localhost",
    "port": "5432"
}

def test_connect(password):
    print(f"Testing connection with password: {password}")
    try:
        conn = psycopg2.connect(
            dbname=DB_CONFIG["dbname"],
            user=DB_CONFIG["user"],
            password=password,
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"]
        )
        print("SUCCESS: Connection established!")
        conn.close()
        return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False

if __name__ == "__main__":
    # Try the user's probable text password first
    if not test_connect("abhishekc1"):
        print("Retrying with default 'password'...")
        test_connect("password")
    else: 
        # Check tables
        try:
            conn = psycopg2.connect(
                dbname=DB_CONFIG["dbname"],
                user=DB_CONFIG["user"],
                password="abhishekc1",
                host=DB_CONFIG["host"],
                port=DB_CONFIG["port"]
            )
            cur = conn.cursor()
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
            tables = cur.fetchall()
            print(f"Tables found: {[t[0] for t in tables]}")
            
            # Inspect claim_images table
            if 'claim_images' in [t[0] for t in tables]:
                cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'claim_images';")
                columns = cur.fetchall()
                print(f"Claim Images columns: {columns}")
                
            conn.close()
        except Exception as e:
            print(f"Error checking tables: {e}")
