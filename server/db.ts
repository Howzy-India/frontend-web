import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      unique_id TEXT,
      rera_number TEXT,
      name TEXT NOT NULL,
      developer_name TEXT,
      city TEXT,
      location TEXT,
      map_link TEXT,
      usp TEXT,
      lead_registration_status TEXT,
      project_type TEXT,
      project_segment TEXT,
      possession TEXT,
      availability TEXT, -- JSON string
      builder_poc_name TEXT,
      builder_poc_contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      budget TEXT,
      location_preferred TEXT,
      looking_bhk TEXT,
      contact TEXT,
      milestone TEXT,
      project_id TEXT,
      document_uploaded BOOLEAN DEFAULT 0,
      assigned_to TEXT,
      campaign_source TEXT,
      campaign_name TEXT,
      status TEXT DEFAULT 'New',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      property_name TEXT,
      ticket_value TEXT,
      invoice_stage TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      check_in DATETIME,
      check_out DATETIME,
      location_lat REAL,
      location_lng REAL,
      date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      property_id TEXT,
      property_name TEXT,
      property_type TEXT,
      location TEXT,
      enquiry_type TEXT,
      source TEXT,
      status TEXT DEFAULT 'New',
      priority TEXT,
      assigned_to TEXT,
      assigned_sales_id TEXT,
      assigned_sales_name TEXT,
      assigned_partner_id TEXT,
      assigned_partner_name TEXT,
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enquiry_timeline (
      id TEXT PRIMARY KEY,
      enquiry_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(enquiry_id) REFERENCES enquiries(id)
    );

    CREATE TABLE IF NOT EXISTS client_logins (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      phone TEXT,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      logout_time DATETIME,
      device_type TEXT,
      browser TEXT,
      ip_address TEXT,
      location TEXT,
      status TEXT,
      failure_reason TEXT
    );
  `);

  // Add columns to enquiries if they don't exist
  try {
    db.exec("ALTER TABLE enquiries ADD COLUMN assigned_sales_id TEXT");
    db.exec("ALTER TABLE enquiries ADD COLUMN assigned_sales_name TEXT");
    db.exec("ALTER TABLE enquiries ADD COLUMN assigned_partner_id TEXT");
    db.exec("ALTER TABLE enquiries ADD COLUMN assigned_partner_name TEXT");
  } catch (e) {
    // Columns might already exist
  }

  // Seed initial data if empty
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0) {
    const insertProject = db.prepare(`
      INSERT INTO projects (id, unique_id, rera_number, name, developer_name, city, location, map_link, usp, lead_registration_status, project_type, project_segment, possession, availability, builder_poc_name, builder_poc_contact)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertProject.run('p1', 'HYD-001', 'P02400001234', 'Skyline Residencies', 'Apex Developers', 'Hyderabad', 'Downtown Metro', 'https://maps.google.com/?q=17.3850,78.4867', 'Infinity Pool & Smart Home Integration', 'Registered', 'Highraise', 'Luxury', 'Under Construction', JSON.stringify({"2BHK": 12, "3BHK": 5}), 'John Doe', '+1 234 567 8900');
    insertProject.run('p2', 'HYD-002', 'P02400005678', 'Green Valley Estates', 'Zenith Constructions', 'Hyderabad', 'Suburban Hills', 'https://maps.google.com/?q=17.4400,78.3489', 'Eco-friendly living with 50% open green space', 'Not successful', 'Gated', 'Premium', 'RTMI', null, null, null);
    
    const insertLead = db.prepare(`
      INSERT INTO leads (id, name, budget, location_preferred, looking_bhk, contact, milestone, project_id, document_uploaded, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertLead.run('l1', 'Alice Smith', '$500k - $750k', 'Downtown', '2BHK', '+1 987 654 3210', 'Site visit', 'p1', 0, 'Contacted');
    insertLead.run('l2', 'Bob Johnson', '$800k - $1.2M', 'Suburban Hills', '3BHK', '+1 555 123 4567', 'Booking done', 'p2', 1, 'Qualified');

    const insertSubmission = db.prepare(`
      INSERT INTO submissions (id, type, name, email, status, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertSubmission.run('s1', 'Builder', 'Prestige Estates', '1234@gmail.com', 'Pending', '{}');
    insertSubmission.run('s2', 'Builder', 'Sobha Developers', '1234@gmail.com', 'Approved', '{}');
    insertSubmission.run('s3', 'Partner', 'Rahul Sharma', '45678@gmail.com', 'Pending', '{}');

    const insertEnquiry = db.prepare(`
      INSERT INTO enquiries (id, client_name, phone, email, property_id, property_name, property_type, location, enquiry_type, source, status, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertEnquiry.run('e1', 'John Doe', '+1 234 567 8901', 'john@example.com', 'p1', 'Skyline Residencies', 'Residential', 'Downtown Metro', 'Site Visit', 'Client Portal', 'Pending', 'Warm');
    insertEnquiry.run('e2', 'Jane Smith', '+1 987 654 3210', 'jane@example.com', 'p2', 'Green Valley Estates', 'Residential', 'Suburban Hills', 'Request Call Back', 'Client Portal', 'Approved', 'Hot');
  }
}

export default db;
