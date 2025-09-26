-- ==========================================
-- Air Niugini B767 Pilot Management System
-- SAMPLE DATA INSERTION SCRIPT
-- ==========================================

-- This script inserts all sample data for the Air Niugini PMS
-- Run this AFTER the main migration script

-- ==========================================
-- INSERT USERS
-- ==========================================

INSERT INTO an_users (email, name, role) VALUES
('admin@airniugini.com.pg', 'John Waigani', 'admin'),
('manager@airniugini.com.pg', 'Mary Pomat', 'manager'),
('ops@airniugini.com.pg', 'Peter Kila', 'manager')
ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- INSERT CHECK TYPES (38 types across 8 categories)
-- ==========================================

INSERT INTO an_check_types (check_code, check_description, category) VALUES
-- License & Ratings (8 checks)
('ATPL', 'Airline Transport Pilot License', 'License & Ratings'),
('CPL', 'Commercial Pilot License', 'License & Ratings'),
('IR', 'Instrument Rating', 'License & Ratings'),
('ME', 'Multi-Engine Rating', 'License & Ratings'),
('B767-TYPE', 'Boeing 767 Type Rating', 'License & Ratings'),
('ELP', 'English Language Proficiency', 'License & Ratings'),
('RT', 'Radio Telephony License', 'License & Ratings'),
('FI', 'Flight Instructor Rating', 'License & Ratings'),

-- Medical & Health (4 checks)
('CLASS1', 'Class 1 Medical Certificate', 'Medical & Health'),
('AUDIOGRAM', 'Annual Audiogram Test', 'Medical & Health'),
('ECG', 'Electrocardiogram Test', 'Medical & Health'),
('VISION', 'Vision Test Certificate', 'Medical & Health'),

-- Recurrent Training (6 checks)
('PC', 'Proficiency Check', 'Recurrent Training'),
('OPC', 'Operator Proficiency Check', 'Recurrent Training'),
('LPC', 'Line Proficiency Check', 'Recurrent Training'),
('RECURRENT', 'Recurrent Training', 'Recurrent Training'),
('CRM', 'Crew Resource Management', 'Recurrent Training'),
('LOFT', 'Line Oriented Flight Training', 'Recurrent Training'),

-- Emergency & Safety (8 checks)
('SEP', 'Safety Equipment Procedures', 'Emergency & Safety'),
('HUET', 'Helicopter Underwater Escape Training', 'Emergency & Safety'),
('BOSIET', 'Basic Offshore Safety Induction', 'Emergency & Safety'),
('FIRST-AID', 'First Aid Certificate', 'Emergency & Safety'),
('FIRE-FIGHT', 'Fire Fighting Training', 'Emergency & Safety'),
('DITCHING', 'Ditching Procedures', 'Emergency & Safety'),
('SLIDES', 'Emergency Slides Training', 'Emergency & Safety'),
('SURVIVAL', 'Survival Training', 'Emergency & Safety'),

-- Security & Compliance (4 checks)
('AVLAW', 'Aviation Law', 'Security & Compliance'),
('SEC-AWARE', 'Security Awareness', 'Security & Compliance'),
('AVSEC', 'Aviation Security Training', 'Security & Compliance'),
('DGR', 'Dangerous Goods Regulations', 'Security & Compliance'),

-- Route & Airport (3 checks)
('ROUTE-POM', 'Port Moresby Route Check', 'Route & Airport'),
('ROUTE-LAE', 'Lae Route Check', 'Route & Airport'),
('ROUTE-MDG', 'Mount Hagen Route Check', 'Route & Airport'),

-- Company Specific (3 checks)
('AN-MANUAL', 'Air Niugini Operations Manual', 'Company Specific'),
('AN-SOP', 'Air Niugini Standard Operating Procedures', 'Company Specific'),
('AN-POLICY', 'Air Niugini Safety Policy', 'Company Specific'),

-- International (2 checks)
('ICAO-ENGLISH', 'ICAO English Language Assessment', 'International'),
('IATA-COURSE', 'IATA Operational Course', 'International')
ON CONFLICT (check_code) DO NOTHING;

-- ==========================================
-- INSERT PILOTS (27 PNG B767 pilots)
-- ==========================================

INSERT INTO an_pilots (
    employee_id, first_name, middle_name, last_name, role,
    contract_type, nationality, passport_number, passport_expiry,
    date_of_birth, commencement_date, is_active
) VALUES
-- Captains (15)
('PX001', 'Michael', 'John', 'Waigani', 'Captain', 'Permanent', 'Papua New Guinea', 'PN123456', '2027-03-15', '1978-02-14', '2001-05-10', true),
('PX002', 'James', 'Peter', 'Pomat', 'Captain', 'Permanent', 'Papua New Guinea', 'PN234567', '2026-11-20', '1975-08-22', '1999-09-15', true),
('PX003', 'Robert', 'Paul', 'Kila', 'Captain', 'Permanent', 'Papua New Guinea', 'PN345678', '2028-01-10', '1980-12-05', '2003-07-20', true),
('PX004', 'David', 'Mark', 'Namaliu', 'Captain', 'Permanent', 'Papua New Guinea', 'PN456789', '2027-09-30', '1977-04-18', '2000-11-25', true),
('PX005', 'Steven', 'Joseph', 'Parkop', 'Captain', 'Permanent', 'Papua New Guinea', 'PN567890', '2026-07-14', '1974-10-12', '1998-03-08', true),
('PX006', 'Anthony', 'William', 'Agarobe', 'Captain', 'Permanent', 'Papua New Guinea', 'PN678901', '2028-05-25', '1981-06-30', '2004-12-15', true),
('PX007', 'Philip', 'Thomas', 'Temu', 'Captain', 'Permanent', 'Papua New Guinea', 'PN789012', '2027-12-08', '1979-01-25', '2002-08-12', true),
('PX008', 'Francis', 'Andrew', 'Marus', 'Captain', 'Permanent', 'Papua New Guinea', 'PN890123', '2026-04-18', '1976-07-14', '1999-10-30', true),
('PX009', 'Samuel', 'Daniel', 'Basil', 'Captain', 'Permanent', 'Papua New Guinea', 'PN901234', '2028-02-22', '1982-09-08', '2005-04-05', true),
('PX010', 'Benjamin', 'Charles', 'Kumo', 'Captain', 'Permanent', 'Papua New Guinea', 'PN012345', '2027-06-12', '1978-11-17', '2001-12-20', true),
('PX011', 'Timothy', 'George', 'Vele', 'Captain', 'Contract', 'Papua New Guinea', 'PN123457', '2026-10-05', '1975-05-28', '1998-07-15', true),
('PX012', 'Joseph', 'Simon', 'Koim', 'Captain', 'Permanent', 'Papua New Guinea', 'PN234568', '2028-08-17', '1983-03-12', '2006-09-10', true),
('PX013', 'Matthew', 'Luke', 'Bani', 'Captain', 'Permanent', 'Papua New Guinea', 'PN345679', '2027-04-28', '1980-12-22', '2003-02-18', true),
('PX014', 'Luke', 'Matthew', 'Siaguru', 'Captain', 'Contract', 'Papua New Guinea', 'PN456780', '2026-12-15', '1976-08-09', '1999-05-25', true),
('PX015', 'Paul', 'John', 'Natera', 'Captain', 'Permanent', 'Papua New Guinea', 'PN567891', '2028-03-20', '1981-04-15', '2004-08-30', true),

-- First Officers (12)
('FO001', 'Sarah', 'Grace', 'Sakias', 'First Officer', 'Permanent', 'Papua New Guinea', 'PN678902', '2027-01-12', '1985-06-20', '2008-03-15', true),
('FO002', 'Jennifer', 'Mary', 'Wanma', 'First Officer', 'Permanent', 'Papua New Guinea', 'PN789013', '2026-09-08', '1984-02-18', '2007-11-20', true),
('FO003', 'Mark', 'David', 'Aihi', 'First Officer', 'Contract', 'Papua New Guinea', 'PN890124', '2028-07-25', '1987-10-12', '2010-05-08', true),
('FO004', 'Daniel', 'Michael', 'Kramer', 'First Officer', 'Permanent', 'Papua New Guinea', 'PN901235', '2027-11-18', '1986-01-28', '2009-07-12', true),
('FO005', 'Andrew', 'Christopher', 'Smare', 'First Officer', 'Permanent', 'Papua New Guinea', 'PN012346', '2026-05-30', '1983-09-14', '2006-12-10', true),
('FO006', 'Christopher', 'Robert', 'Haiveta', 'First Officer', 'Contract', 'Papua New Guinea', 'PN123458', '2028-04-14', '1988-07-22', '2011-09-15', true),
('FO007', 'Nicholas', 'Francis', 'Wamytan', 'First Officer', 'Permanent', 'Papua New Guinea', 'PN234569', '2027-08-06', '1985-11-08', '2008-10-25', true),
('FO008', 'Jonathan', 'Samuel', 'Pundari', 'First Officer', 'Permanent', 'Papua New Guinea', 'PN345680', '2026-02-22', '1982-04-16', '2005-08-18', true),
('FO009', 'Richard', 'Anthony', 'Marat', 'First Officer', 'Contract', 'Papua New Guinea', 'PN456781', '2028-06-10', '1989-12-05', '2012-04-20', true),
('FO010', 'Thomas', 'Benjamin', 'Kapris', 'First Officer', 'Permanent', 'Papua New Guinea', 'PN567892', '2027-10-28', '1986-08-30', '2009-12-05', true),
('FO011', 'Michael', 'Paul', 'Dusava', 'First Officer', 'Permanent', 'Papua New Guinea', 'PN678903', '2026-08-15', '1984-05-12', '2007-09-30', true),
('FO012', 'Peter', 'Joseph', 'Nali', 'First Officer', 'Contract', 'Papua New Guinea', 'PN789014', '2028-01-08', '1987-03-28', '2010-11-15', true)
ON CONFLICT (employee_id) DO NOTHING;

COMMIT;

-- Show status
SELECT
    'Sample data inserted successfully!' as status,
    (SELECT COUNT(*) FROM an_users) as users_count,
    (SELECT COUNT(*) FROM an_pilots) as pilots_count,
    (SELECT COUNT(*) FROM an_check_types) as check_types_count;