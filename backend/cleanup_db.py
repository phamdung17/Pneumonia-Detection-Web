#!/usr/bin/env python3
"""
Database cleanup script
Removes duplicate columns from original tables after split
"""

import sys
from pathlib import Path
import os

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))
os.chdir(backend_dir)

from sqlalchemy import create_engine, text, inspect
from config import get_settings

settings = get_settings()

def cleanup_db():
    """Remove duplicate columns from old tables"""
    print("🧹 Cleaning up duplicate columns from old tables...")
    db_url = settings.sqlalchemy_database_uri
    print(f"📍 Database URL: {db_url}\n")
    
    engine = create_engine(db_url, echo=False)
    
    # Columns to remove from users table
    users_cols_to_remove = [
        # These columns are now in user_profiles
        'full_name', 'email', 'phone', 'avatar_url',
        # These columns are now in user_security_logs
        'failed_login_count', 'locked_until', 'last_login'
    ]
    
    # Columns to remove from predictions table
    predictions_cols_to_remove = [
        # Now in prediction_patient_info
        'patient_name', 'patient_age', 'patient_gender', 'technician_name', 'performed_at',
        # Now in prediction_results
        'prediction', 'ensemble_status', 'confidence', 'prob_dn', 'prob_eff', 
        'disease_type', 'bacterial_prob', 'viral_prob', 'covid_prob',
        # Now in prediction_analysis
        'lesion_pct', 'bbox_x1', 'bbox_y1', 'bbox_x2', 'bbox_y2', 'dice_score',
        'heatmap_dn_path', 'heatmap_eff_path', 'lung_mask_path',
        # Now in prediction_doctor_review
        'doctor_note', 'doctor_confirmed',
        # Now in prediction_processing_log
        'error_message', 'processing_time_ms', 'completed_at'
    ]
    
    # Check and remove columns
    inspector = inspect(engine)
    
    print("📊 Checking users table...")
    users_cols = {col['name'] for col in inspector.get_columns('users')}
    cols_to_drop_users = [col for col in users_cols_to_remove if col in users_cols]
    
    if cols_to_drop_users:
        print(f"❌ Found {len(cols_to_drop_users)} duplicate columns in users table:")
        for col in cols_to_drop_users:
            print(f"   - {col}")
        
        with engine.connect() as conn:
            for col in cols_to_drop_users:
                try:
                    sql = f"ALTER TABLE users DROP COLUMN {col}"
                    conn.execute(text(sql))
                    print(f"   ✅ Dropped: {col}")
                except Exception as e:
                    print(f"   ⚠️  Error dropping {col}: {e}")
            conn.commit()
    else:
        print("✅ No duplicate columns in users table")
    
    print("\n📊 Checking predictions table...")
    predictions_cols = {col['name'] for col in inspector.get_columns('predictions')}
    cols_to_drop_predictions = [col for col in predictions_cols_to_remove if col in predictions_cols]
    
    if cols_to_drop_predictions:
        print(f"❌ Found {len(cols_to_drop_predictions)} duplicate columns in predictions table:")
        for col in cols_to_drop_predictions:
            print(f"   - {col}")
        
        with engine.connect() as conn:
            for col in cols_to_drop_predictions:
                try:
                    sql = f"ALTER TABLE predictions DROP COLUMN {col}"
                    conn.execute(text(sql))
                    print(f"   ✅ Dropped: {col}")
                except Exception as e:
                    print(f"   ⚠️  Error dropping {col}: {e}")
            conn.commit()
    else:
        print("✅ No duplicate columns in predictions table")
    
    # Verify final structure
    print("\n✨ Final table structures:")
    
    inspector = inspect(engine)
    
    print("\n📋 users table columns:")
    for col in inspector.get_columns('users'):
        print(f"   • {col['name']}: {col['type']}")
    
    print("\n📋 predictions table columns:")
    for col in inspector.get_columns('predictions'):
        print(f"   • {col['name']}: {col['type']}")
    
    print("\n✅ Cleanup completed!")

if __name__ == "__main__":
    try:
        cleanup_db()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
