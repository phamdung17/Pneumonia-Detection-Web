#!/usr/bin/env python3
"""
Database initialization script
Creates all tables from models using SQLAlchemy
"""

import sys
from pathlib import Path
import os

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set working directory
os.chdir(backend_dir)

# Import with correct path
from sqlalchemy import create_engine, inspect
from database.models import Base
from config import get_settings

settings = get_settings()

def init_db():
    """Initialize database with all tables"""
    print("🔧 Initializing Database...")
    db_url = settings.sqlalchemy_database_uri
    print(f"📍 Database URL: {db_url}")
    
    # Create engine
    engine = create_engine(db_url, echo=True)
    
    # Check existing tables
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    print(f"📊 Existing tables: {existing_tables}")
    
    # Create all tables
    print("\n✨ Creating tables...")
    Base.metadata.create_all(engine)
    
    # Verify tables created
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\n✅ Tables created successfully!")
    print(f"📋 Total tables: {len(tables)}")
    print(f"📝 Table list:")
    for table in sorted(tables):
        print(f"   • {table}")
        cols = inspector.get_columns(table)
        for col in cols:
            print(f"     - {col['name']}: {col['type']}")

if __name__ == "__main__":
    try:
        init_db()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
