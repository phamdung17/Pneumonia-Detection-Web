"""Split users and predictions tables for better data organization

Revision ID: 001
Revises: 
Create Date: 2026-05-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ========== CREATE NEW USER RELATED TABLES ==========
    
    # Create user_profiles table
    op.create_table(
        'user_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_user_profiles_email'), 'user_profiles', ['email'], unique=False)
    op.create_index(op.f('ix_user_profiles_phone'), 'user_profiles', ['phone'], unique=False)
    op.create_index(op.f('ix_user_profiles_user_id'), 'user_profiles', ['user_id'], unique=True)

    # Create user_security_logs table
    op.create_table(
        'user_security_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('failed_login_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('locked_until', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_user_security_logs_user_id'), 'user_security_logs', ['user_id'], unique=True)

    # ========== MIGRATE DATA FROM OLD USERS TABLE ==========
    
    # Insert data into user_profiles from existing users
    op.execute("""
        INSERT INTO user_profiles (user_id, full_name, email, phone, avatar_url, created_at)
        SELECT id, full_name, email, phone, avatar_url, created_at FROM users
    """)
    
    # Insert data into user_security_logs from existing users
    op.execute("""
        INSERT INTO user_security_logs (user_id, failed_login_count, locked_until, last_login, created_at)
        SELECT id, failed_login_count, locked_until, last_login, created_at FROM users
    """)

    # ========== DROP OLD COLUMNS FROM USERS TABLE ==========
    
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_phone', table_name='users')
    op.drop_column('users', 'full_name')
    op.drop_column('users', 'email')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'failed_login_count')
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'last_login')

    # ========== CREATE NEW PREDICTION RELATED TABLES ==========
    
    # Create prediction_patient_info table
    op.create_table(
        'prediction_patient_info',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('prediction_id', sa.Integer(), nullable=False),
        sa.Column('patient_name', sa.String(length=255), nullable=True),
        sa.Column('patient_age', sa.Integer(), nullable=True),
        sa.Column('patient_gender', sa.String(length=32), nullable=True),
        sa.Column('technician_name', sa.String(length=255), nullable=True),
        sa.Column('performed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['prediction_id'], ['predictions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('prediction_id')
    )
    op.create_index(op.f('ix_prediction_patient_info_prediction_id'), 'prediction_patient_info', ['prediction_id'], unique=True)

    # Create prediction_results table
    op.create_table(
        'prediction_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('prediction_id', sa.Integer(), nullable=False),
        sa.Column('prediction', sa.Enum('NORMAL', 'PNEUMONIA'), nullable=True),
        sa.Column('ensemble_status', sa.Enum('CONFIRMED', 'SUSPECTED'), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('prob_dn', sa.Float(), nullable=True),
        sa.Column('prob_eff', sa.Float(), nullable=True),
        sa.Column('disease_type', sa.Enum('BACTERIAL', 'VIRAL', 'COVID', 'NONE'), nullable=True),
        sa.Column('bacterial_prob', sa.Float(), nullable=True),
        sa.Column('viral_prob', sa.Float(), nullable=True),
        sa.Column('covid_prob', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['prediction_id'], ['predictions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('prediction_id')
    )
    op.create_index(op.f('ix_prediction_results_prediction_id'), 'prediction_results', ['prediction_id'], unique=True)

    # Create prediction_analysis table
    op.create_table(
        'prediction_analysis',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('prediction_id', sa.Integer(), nullable=False),
        sa.Column('lesion_pct', sa.Float(), nullable=True),
        sa.Column('bbox_x1', sa.Integer(), nullable=True),
        sa.Column('bbox_y1', sa.Integer(), nullable=True),
        sa.Column('bbox_x2', sa.Integer(), nullable=True),
        sa.Column('bbox_y2', sa.Integer(), nullable=True),
        sa.Column('dice_score', sa.Float(), nullable=True),
        sa.Column('heatmap_dn_path', sa.String(length=500), nullable=True),
        sa.Column('heatmap_eff_path', sa.String(length=500), nullable=True),
        sa.Column('lung_mask_path', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['prediction_id'], ['predictions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('prediction_id')
    )
    op.create_index(op.f('ix_prediction_analysis_prediction_id'), 'prediction_analysis', ['prediction_id'], unique=True)

    # Create prediction_doctor_review table
    op.create_table(
        'prediction_doctor_review',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('prediction_id', sa.Integer(), nullable=False),
        sa.Column('doctor_note', sa.Text(), nullable=True),
        sa.Column('doctor_confirmed', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['prediction_id'], ['predictions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('prediction_id')
    )
    op.create_index(op.f('ix_prediction_doctor_review_prediction_id'), 'prediction_doctor_review', ['prediction_id'], unique=True)

    # Create prediction_processing_log table
    op.create_table(
        'prediction_processing_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('prediction_id', sa.Integer(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['prediction_id'], ['predictions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('prediction_id')
    )
    op.create_index(op.f('ix_prediction_processing_log_prediction_id'), 'prediction_processing_log', ['prediction_id'], unique=True)

    # ========== MIGRATE DATA FROM OLD PREDICTIONS TABLE ==========
    
    # Insert data into prediction_patient_info
    op.execute("""
        INSERT INTO prediction_patient_info (prediction_id, patient_name, patient_age, patient_gender, technician_name, performed_at, created_at)
        SELECT id, patient_name, patient_age, patient_gender, technician_name, performed_at, created_at FROM predictions
    """)
    
    # Insert data into prediction_results
    op.execute("""
        INSERT INTO prediction_results (prediction_id, prediction, ensemble_status, confidence, prob_dn, prob_eff, disease_type, bacterial_prob, viral_prob, covid_prob, created_at)
        SELECT id, prediction, ensemble_status, confidence, prob_dn, prob_eff, disease_type, bacterial_prob, viral_prob, covid_prob, created_at FROM predictions
    """)
    
    # Insert data into prediction_analysis
    op.execute("""
        INSERT INTO prediction_analysis (prediction_id, lesion_pct, bbox_x1, bbox_y1, bbox_x2, bbox_y2, dice_score, heatmap_dn_path, heatmap_eff_path, lung_mask_path, created_at)
        SELECT id, lesion_pct, bbox_x1, bbox_y1, bbox_x2, bbox_y2, dice_score, heatmap_dn_path, heatmap_eff_path, lung_mask_path, created_at FROM predictions
    """)
    
    # Insert data into prediction_doctor_review
    op.execute("""
        INSERT INTO prediction_doctor_review (prediction_id, doctor_note, doctor_confirmed, created_at)
        SELECT id, doctor_note, doctor_confirmed, created_at FROM predictions
    """)
    
    # Insert data into prediction_processing_log
    op.execute("""
        INSERT INTO prediction_processing_log (prediction_id, error_message, processing_time_ms, completed_at, created_at)
        SELECT id, error_message, processing_time_ms, completed_at, created_at FROM predictions
    """)

    # ========== DROP OLD COLUMNS FROM PREDICTIONS TABLE ==========
    
    op.drop_column('predictions', 'patient_name')
    op.drop_column('predictions', 'patient_age')
    op.drop_column('predictions', 'patient_gender')
    op.drop_column('predictions', 'technician_name')
    op.drop_column('predictions', 'performed_at')
    op.drop_column('predictions', 'prediction')
    op.drop_column('predictions', 'ensemble_status')
    op.drop_column('predictions', 'confidence')
    op.drop_column('predictions', 'prob_dn')
    op.drop_column('predictions', 'prob_eff')
    op.drop_column('predictions', 'disease_type')
    op.drop_column('predictions', 'bacterial_prob')
    op.drop_column('predictions', 'viral_prob')
    op.drop_column('predictions', 'covid_prob')
    op.drop_column('predictions', 'lesion_pct')
    op.drop_column('predictions', 'bbox_x1')
    op.drop_column('predictions', 'bbox_y1')
    op.drop_column('predictions', 'bbox_x2')
    op.drop_column('predictions', 'bbox_y2')
    op.drop_column('predictions', 'dice_score')
    op.drop_column('predictions', 'heatmap_dn_path')
    op.drop_column('predictions', 'heatmap_eff_path')
    op.drop_column('predictions', 'lung_mask_path')
    op.drop_column('predictions', 'doctor_note')
    op.drop_column('predictions', 'doctor_confirmed')
    op.drop_column('predictions', 'error_message')
    op.drop_column('predictions', 'processing_time_ms')
    op.drop_column('predictions', 'completed_at')


def downgrade() -> None:
    # ========== RESTORE PREDICTIONS TABLE ==========
    
    # Add old columns back to predictions
    op.add_column('predictions', sa.Column('completed_at', mysql.DATETIME(), nullable=True))
    op.add_column('predictions', sa.Column('processing_time_ms', mysql.INTEGER(), nullable=True))
    op.add_column('predictions', sa.Column('error_message', mysql.TEXT(), nullable=True))
    op.add_column('predictions', sa.Column('doctor_confirmed', mysql.BOOLEAN(), nullable=True))
    op.add_column('predictions', sa.Column('doctor_note', mysql.TEXT(), nullable=True))
    op.add_column('predictions', sa.Column('lung_mask_path', mysql.VARCHAR(length=500), nullable=True))
    op.add_column('predictions', sa.Column('heatmap_eff_path', mysql.VARCHAR(length=500), nullable=True))
    op.add_column('predictions', sa.Column('heatmap_dn_path', mysql.VARCHAR(length=500), nullable=True))
    op.add_column('predictions', sa.Column('dice_score', mysql.FLOAT(), nullable=True))
    op.add_column('predictions', sa.Column('bbox_y2', mysql.INTEGER(), nullable=True))
    op.add_column('predictions', sa.Column('bbox_x2', mysql.INTEGER(), nullable=True))
    op.add_column('predictions', sa.Column('bbox_y1', mysql.INTEGER(), nullable=True))
    op.add_column('predictions', sa.Column('bbox_x1', mysql.INTEGER(), nullable=True))
    op.add_column('predictions', sa.Column('lesion_pct', mysql.FLOAT(), nullable=True))
    op.add_column('predictions', sa.Column('covid_prob', mysql.FLOAT(), nullable=True))
    op.add_column('predictions', sa.Column('viral_prob', mysql.FLOAT(), nullable=True))
    op.add_column('predictions', sa.Column('bacterial_prob', mysql.FLOAT(), nullable=True))
    op.add_column('predictions', sa.Column('disease_type', mysql.ENUM('BACTERIAL', 'VIRAL', 'COVID', 'NONE'), nullable=True))
    op.add_column('predictions', sa.Column('prob_eff', mysql.FLOAT(), nullable=True))
    op.add_column('predictions', sa.Column('prob_dn', mysql.FLOAT(), nullable=True))
    op.add_column('predictions', sa.Column('confidence', mysql.FLOAT(), nullable=True))
    op.add_column('predictions', sa.Column('ensemble_status', mysql.ENUM('CONFIRMED', 'SUSPECTED'), nullable=True))
    op.add_column('predictions', sa.Column('prediction', mysql.ENUM('NORMAL', 'PNEUMONIA'), nullable=True))
    op.add_column('predictions', sa.Column('performed_at', mysql.DATETIME(), nullable=True))
    op.add_column('predictions', sa.Column('technician_name', mysql.VARCHAR(length=255), nullable=True))
    op.add_column('predictions', sa.Column('patient_gender', mysql.VARCHAR(length=32), nullable=True))
    op.add_column('predictions', sa.Column('patient_age', mysql.INTEGER(), nullable=True))
    op.add_column('predictions', sa.Column('patient_name', mysql.VARCHAR(length=255), nullable=True))
    
    # Restore data from new tables
    op.execute("""
        UPDATE predictions p
        SET p.patient_name = (SELECT patient_name FROM prediction_patient_info WHERE prediction_id = p.id),
            p.patient_age = (SELECT patient_age FROM prediction_patient_info WHERE prediction_id = p.id),
            p.patient_gender = (SELECT patient_gender FROM prediction_patient_info WHERE prediction_id = p.id),
            p.technician_name = (SELECT technician_name FROM prediction_patient_info WHERE prediction_id = p.id),
            p.performed_at = (SELECT performed_at FROM prediction_patient_info WHERE prediction_id = p.id),
            p.prediction = (SELECT prediction FROM prediction_results WHERE prediction_id = p.id),
            p.ensemble_status = (SELECT ensemble_status FROM prediction_results WHERE prediction_id = p.id),
            p.confidence = (SELECT confidence FROM prediction_results WHERE prediction_id = p.id),
            p.prob_dn = (SELECT prob_dn FROM prediction_results WHERE prediction_id = p.id),
            p.prob_eff = (SELECT prob_eff FROM prediction_results WHERE prediction_id = p.id),
            p.disease_type = (SELECT disease_type FROM prediction_results WHERE prediction_id = p.id),
            p.bacterial_prob = (SELECT bacterial_prob FROM prediction_results WHERE prediction_id = p.id),
            p.viral_prob = (SELECT viral_prob FROM prediction_results WHERE prediction_id = p.id),
            p.covid_prob = (SELECT covid_prob FROM prediction_results WHERE prediction_id = p.id),
            p.lesion_pct = (SELECT lesion_pct FROM prediction_analysis WHERE prediction_id = p.id),
            p.bbox_x1 = (SELECT bbox_x1 FROM prediction_analysis WHERE prediction_id = p.id),
            p.bbox_y1 = (SELECT bbox_y1 FROM prediction_analysis WHERE prediction_id = p.id),
            p.bbox_x2 = (SELECT bbox_x2 FROM prediction_analysis WHERE prediction_id = p.id),
            p.bbox_y2 = (SELECT bbox_y2 FROM prediction_analysis WHERE prediction_id = p.id),
            p.dice_score = (SELECT dice_score FROM prediction_analysis WHERE prediction_id = p.id),
            p.heatmap_dn_path = (SELECT heatmap_dn_path FROM prediction_analysis WHERE prediction_id = p.id),
            p.heatmap_eff_path = (SELECT heatmap_eff_path FROM prediction_analysis WHERE prediction_id = p.id),
            p.lung_mask_path = (SELECT lung_mask_path FROM prediction_analysis WHERE prediction_id = p.id),
            p.doctor_note = (SELECT doctor_note FROM prediction_doctor_review WHERE prediction_id = p.id),
            p.doctor_confirmed = (SELECT doctor_confirmed FROM prediction_doctor_review WHERE prediction_id = p.id),
            p.error_message = (SELECT error_message FROM prediction_processing_log WHERE prediction_id = p.id),
            p.processing_time_ms = (SELECT processing_time_ms FROM prediction_processing_log WHERE prediction_id = p.id),
            p.completed_at = (SELECT completed_at FROM prediction_processing_log WHERE prediction_id = p.id)
    """)
    
    # Drop new prediction tables
    op.drop_table('prediction_processing_log')
    op.drop_table('prediction_doctor_review')
    op.drop_table('prediction_analysis')
    op.drop_table('prediction_results')
    op.drop_table('prediction_patient_info')

    # ========== RESTORE USERS TABLE ==========
    
    # Add old columns back to users
    op.add_column('users', sa.Column('last_login', mysql.DATETIME(), nullable=True))
    op.add_column('users', sa.Column('locked_until', mysql.DATETIME(), nullable=True))
    op.add_column('users', sa.Column('failed_login_count', mysql.INTEGER(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('avatar_url', mysql.VARCHAR(length=500), nullable=True))
    op.add_column('users', sa.Column('phone', mysql.VARCHAR(length=20), nullable=True))
    op.add_column('users', sa.Column('email', mysql.VARCHAR(length=255), nullable=True))
    op.add_column('users', sa.Column('full_name', mysql.VARCHAR(length=255), nullable=False))
    
    # Create indexes again
    op.create_index('ix_users_phone', 'users', ['phone'], unique=False)
    op.create_index('ix_users_email', 'users', ['email'], unique=False)
    
    # Restore data from new tables
    op.execute("""
        UPDATE users u
        SET u.full_name = (SELECT full_name FROM user_profiles WHERE user_id = u.id),
            u.email = (SELECT email FROM user_profiles WHERE user_id = u.id),
            u.phone = (SELECT phone FROM user_profiles WHERE user_id = u.id),
            u.avatar_url = (SELECT avatar_url FROM user_profiles WHERE user_id = u.id),
            u.failed_login_count = (SELECT failed_login_count FROM user_security_logs WHERE user_id = u.id),
            u.locked_until = (SELECT locked_until FROM user_security_logs WHERE user_id = u.id),
            u.last_login = (SELECT last_login FROM user_security_logs WHERE user_id = u.id)
    """)
    
    # Drop new user tables
    op.drop_table('user_security_logs')
    op.drop_table('user_profiles')
