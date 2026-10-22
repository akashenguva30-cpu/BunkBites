#!/usr/bin/env python3
"""
migrate_image_to_cloudinary.py
──────────────────────────────
One-shot migration script that:
  1. Uploads backend/uploads/menu/<filename>.jpg → Cloudinary
  2. Updates the `image_url` column in the Neon PostgreSQL database
     for every menu_item whose image_url matches the old local path pattern
     (/uploads/menu/<filename>).

Usage (run ONCE after setting Render env vars):
  pip install cloudinary psycopg2-binary
  python migrate_image_to_cloudinary.py

Required environment variables (or edit the constants below):
  CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
  DB_URL   – full JDBC URL from Render, e.g.
             jdbc:postgresql://ep-xxx.neon.tech/neondb?sslmode=require
             (the script converts JDBC → psycopg2 format automatically)
"""

import os
import sys
import glob
import cloudinary
import cloudinary.uploader
import psycopg2
import re

# ── Configuration ───────────────────────────────────────────────────────────

CLOUD_NAME  = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
API_KEY     = os.environ.get("CLOUDINARY_API_KEY", "")
API_SECRET  = os.environ.get("CLOUDINARY_API_SECRET", "")
JDBC_URL    = os.environ.get("DB_URL", "")
DB_USER     = os.environ.get("DB_USER", "")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")

# Directory that contains the local upload images (relative to repo root)
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "backend", "uploads", "menu")

# ── Helpers ─────────────────────────────────────────────────────────────────

def jdbc_to_psycopg2(jdbc_url: str) -> str:
    """Convert jdbc:postgresql://host/db?params  →  host=... dbname=... options"""
    m = re.match(r"jdbc:postgresql://([^/]+)/([^?]+)(\?.*)?", jdbc_url)
    if not m:
        raise ValueError(f"Cannot parse JDBC URL: {jdbc_url!r}")
    host    = m.group(1)
    dbname  = m.group(2)
    params  = m.group(3) or ""
    # sslmode handling
    ssl = "require" if "sslmode=require" in params else "prefer"
    return f"host={host} dbname={dbname} sslmode={ssl}"

# ── Main ────────────────────────────────────────────────────────────────────

def main():
    if not all([CLOUD_NAME, API_KEY, API_SECRET]):
        sys.exit("ERROR: Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET")
    if not JDBC_URL:
        sys.exit("ERROR: Set DB_URL (the JDBC URL from Render / Neon)")

    cloudinary.config(cloud_name=CLOUD_NAME, api_key=API_KEY, api_secret=API_SECRET, secure=True)

    dsn = jdbc_to_psycopg2(JDBC_URL)
    conn = psycopg2.connect(dsn, user=DB_USER, password=DB_PASSWORD)
    cur  = conn.cursor()

    images = glob.glob(os.path.join(UPLOADS_DIR, "*.jpg")) + \
             glob.glob(os.path.join(UPLOADS_DIR, "*.png")) + \
             glob.glob(os.path.join(UPLOADS_DIR, "*.webp"))

    if not images:
        sys.exit(f"No images found in {UPLOADS_DIR}")

    print(f"Found {len(images)} image(s) to migrate.\n")

    for local_path in images:
        filename   = os.path.basename(local_path)
        local_url  = f"/uploads/menu/{filename}"

        # Only migrate if the DB still references the local path
        cur.execute("SELECT id, name FROM menu_items WHERE image_url = %s", (local_url,))
        rows = cur.fetchall()

        if not rows:
            print(f"  SKIP  {filename}  (no matching DB row)")
            continue

        print(f"  UPLOADING  {filename}  (used by {len(rows)} item(s))...")
        result = cloudinary.uploader.upload(
            local_path,
            folder="bunkbites/menu",
            resource_type="image"
        )
        cloud_url = result["secure_url"]
        print(f"  → {cloud_url}")

        cur.execute(
            "UPDATE menu_items SET image_url = %s WHERE image_url = %s",
            (cloud_url, local_url)
        )
        for row_id, row_name in rows:
            print(f"     Updated menu_item id={row_id} name={row_name!r}")

    conn.commit()
    cur.close()
    conn.close()
    print("\nMigration complete. All local image_url values updated to Cloudinary URLs.")

if __name__ == "__main__":
    main()
