import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { google } from "googleapis";
import db, { initDb } from "../frontend-web/server/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database
initDb();

// Google OAuth Setup
const getGoogleOAuthClient = (redirectUri: string) => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

async function startServer() {
  const app = express();
  
  // Add CORS headers for PWABuilder and other external tools
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  app.use(express.json());
  app.use(cookieParser());
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Join rooms based on role (simple simulation)
    socket.on("join", (role) => {
      socket.join(role);
      console.log(`User ${socket.id} joined room: ${role}`);
    });

    // Handle broadcast from Super Admin to Pilots
    socket.on("send-broadcast", (notification) => {
      console.log("Broadcasting notification to pilots:", notification);
      // In a real app, we'd save this to a DB
      io.to("pilot").emit("new-notification", {
        ...notification,
        id: Date.now(),
        time: "Just now",
        unread: true
      });
    });

    // Handle new lead creation
    socket.on("new-lead", (lead) => {
      console.log("New lead added:", lead.name);
      io.to("pilot").emit("new-notification", {
        id: Date.now(),
        type: "new-lead",
        title: "New Lead Added",
        message: `${lead.name} is looking for a ${lead.lookingBhk} in ${lead.locationPreferred}.`,
        time: "Just now",
        unread: true,
        icon: "Users",
        color: "emerald"
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- Database API Routes ---
  app.get("/api/projects", (req, res) => {
    try {
      const projects = db.prepare("SELECT * FROM projects").all();
      const mappedProjects = projects.map((p: any) => ({
        id: p.id,
        uniqueId: p.unique_id,
        reraNumber: p.rera_number,
        name: p.name,
        developerName: p.developer_name,
        city: p.city,
        location: p.location,
        mapLink: p.map_link,
        usp: p.usp,
        leadRegistrationStatus: p.lead_registration_status,
        projectType: p.project_type,
        propertyType: 'project',
        projectSegment: p.project_segment,
        possession: p.possession,
        availability: p.availability ? JSON.parse(p.availability) : null,
        builderPoc: p.builder_poc_name ? { name: p.builder_poc_name, contact: p.builder_poc_contact } : null,
        createdAt: p.created_at
      }));

      // Also fetch approved property submissions
      const submissions = db.prepare("SELECT * FROM submissions WHERE status = 'Approved' AND type IN ('Farm Land', 'Plot', 'Residential', 'Commercial')").all();
      
      const mappedSubmissions = submissions.map((s: any) => {
        const details = s.details ? JSON.parse(s.details) : {};
        
        let propertyType = 'project';
        if (s.type === 'Farm Land') propertyType = 'farmland';
        if (s.type === 'Plot') propertyType = 'plot';

        return {
          id: s.id,
          uniqueId: s.id,
          reraNumber: details.reraNumber || '',
          name: s.name,
          developerName: details.developerName || s.name,
          city: details.city || '',
          location: details.location || details.city || '',
          mapLink: details.mapLink || '',
          usp: details.description || details.usp || '',
          leadRegistrationStatus: 'Registered',
          projectType: s.type,
          propertyType: propertyType,
          projectSegment: details.price || details.budget || '',
          possession: details.possession || '',
          availability: null,
          builderPoc: { name: s.name, contact: s.email },
          createdAt: s.created_at
        };
      });

      res.json({ projects: [...mappedProjects, ...mappedSubmissions] });
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/leads", (req, res) => {
    try {
      const leads = db.prepare("SELECT * FROM leads").all();
      res.json({ leads });
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", (req, res) => {
    try {
      const { name, budget, location_preferred, looking_bhk, contact, milestone, project_id, document_uploaded, status } = req.body;
      const id = `l${Date.now()}`;
      const insert = db.prepare(`
        INSERT INTO leads (id, name, budget, location_preferred, looking_bhk, contact, milestone, project_id, document_uploaded, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(id, name, budget, location_preferred, looking_bhk, contact, milestone, project_id, document_uploaded ? 1 : 0, status || 'New');
      res.json({ success: true, id });
      
      // Emit socket event
      io.to("pilot").emit("new-notification", {
        id: Date.now(),
        type: "new-lead",
        title: "New Lead Added",
        message: `${name} is looking for a ${looking_bhk} in ${location_preferred}.`,
        time: "Just now",
        unread: true,
        icon: "Users",
        color: "emerald"
      });
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  app.post("/api/leads/auto-assign", (req, res) => {
    try {
      const unassignedLeads = db.prepare("SELECT * FROM leads WHERE assigned_to IS NULL OR assigned_to = 'Unassigned'").all();
      
      const partners = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy'];
      
      const update = db.prepare("UPDATE leads SET assigned_to = ? WHERE id = ?");
      
      let assignedCount = 0;
      
      // Use a transaction for bulk updates
      const transaction = db.transaction((leads) => {
        for (const lead of leads) {
          const randomPartner = partners[Math.floor(Math.random() * partners.length)];
          update.run(randomPartner, lead.id);
          assignedCount++;
        }
      });
      
      transaction(unassignedLeads);
      
      res.json({ success: true, assignedCount });
    } catch (error) {
      console.error("Error auto-assigning leads:", error);
      res.status(500).json({ error: "Failed to auto-assign leads" });
    }
  });

  app.get("/api/earnings", (req, res) => {
    try {
      const bookings = db.prepare("SELECT * FROM bookings").all();
      res.json({
        totalBookingsMonth: bookings.length,
        totalEarningValue: "$45,000", // Calculate from bookings in real app
        bookings
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ error: "Failed to fetch earnings" });
    }
  });

  app.get("/api/submissions", (req, res) => {
    try {
      const email = req.query.email as string;
      let submissions;
      if (email) {
        submissions = db.prepare("SELECT * FROM submissions WHERE email = ?").all(email);
      } else {
        submissions = db.prepare("SELECT * FROM submissions").all();
      }
      res.json({ submissions: submissions.map((s: any) => ({
        ...s,
        details: s.details ? JSON.parse(s.details) : {},
        date: s.created_at.split(' ')[0]
      })) });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.post("/api/submissions", (req, res) => {
    try {
      const { type, name, email, details } = req.body;
      const id = `s${Date.now()}`;
      const insert = db.prepare(`
        INSERT INTO submissions (id, type, name, email, status, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insert.run(id, type, name, email, 'Pending', JSON.stringify(details || {}));
      res.json({ success: true, id });
      
      // Emit socket event
      io.to("admin").emit("new-notification", {
        id: Date.now(),
        type: "new-submission",
        title: "New Submission",
        message: `New ${type} submission from ${name}.`,
        time: "Just now",
        unread: true,
        icon: "FileText",
        color: "indigo"
      });
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ error: "Failed to create submission" });
    }
  });

  app.patch("/api/submissions/:id/status", (req, res) => {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      
      const submission = db.prepare("SELECT * FROM submissions WHERE id = ?").get(id) as any;
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      const details = JSON.parse(submission.details || '{}');
      details.remarks = remarks;

      let generatedPartnerId = null;

      // If it's a Partner submission and it's being approved, generate a Partner ID
      if (submission.type === 'Partner' && status === 'Approved') {
        const cityCode = details.city ? details.city.substring(0, 3).toUpperCase() : 'GEN';
        // In a real app, you'd query the DB for the next sequence number for this city
        const sequenceNumber = Math.floor(Math.random() * 9000) + 1000; 
        generatedPartnerId = `HZ-${cityCode}-PTN-${sequenceNumber}`;
        details.partnerId = generatedPartnerId;
        
        // Mock Email/SMS notification
        console.log(`\n[NOTIFICATION SYSTEM]`);
        console.log(`Sending Email to: ${submission.email}`);
        console.log(`Subject: Welcome to Howzy - Your Partner Account is Approved`);
        console.log(`Body: Dear ${submission.name},\nYour partner account has been approved. Your unique Partner ID is ${generatedPartnerId}.\nYou can now log in to the Partner Dashboard using your registered email.\n`);
        
        if (details.mobileNumber) {
          console.log(`Sending SMS to: ${details.mobileNumber}`);
          console.log(`Message: Welcome to Howzy! Your partner account is approved. Partner ID: ${generatedPartnerId}. Login to access your dashboard.\n`);
        }
      }

      const update = db.prepare("UPDATE submissions SET status = ?, details = ? WHERE id = ?");
      update.run(status, JSON.stringify(details), id);
      
      res.json({ success: true, partnerId: generatedPartnerId });
    } catch (error) {
      console.error("Error updating submission status:", error);
      res.status(500).json({ error: "Failed to update submission status" });
    }
  });
  app.get("/api/enquiries", (req, res) => {
    try {
      const enquiries = db.prepare("SELECT * FROM enquiries ORDER BY created_at DESC").all();
      res.json({ enquiries });
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      res.status(500).json({ error: "Failed to fetch enquiries" });
    }
  });

  app.post("/api/client/login-track", (req, res) => {
    try {
      const { email, phone, device_type, browser, ip_address, location, status, failure_reason } = req.body;
      const id = Date.now().toString();
      const insert = db.prepare(`
        INSERT INTO client_logins (id, email, phone, device_type, browser, ip_address, location, status, failure_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(id, email, phone || null, device_type || 'Unknown', browser || 'Unknown', ip_address || 'Unknown', location || 'Unknown', status || 'Success', failure_reason || null);
      
      // Emit socket event to admin for security alerts if failed
      if (status === 'Failed') {
        io.to("admin").emit("new-notification", {
          id: Date.now(),
          type: "security-alert",
          title: "Failed Login Attempt",
          message: `Failed login attempt for ${email}. Reason: ${failure_reason}`,
          time: "Just now",
          unread: true,
          icon: "AlertTriangle",
          color: "red"
        });
      }

      res.json({ success: true, id });
    } catch (error) {
      console.error("Error tracking login:", error);
      res.status(500).json({ error: "Failed to track login" });
    }
  });

  app.get("/api/admin/client-logins", (req, res) => {
    try {
      const logins = db.prepare("SELECT * FROM client_logins ORDER BY login_time DESC").all();
      res.json({ logins });
    } catch (error) {
      console.error("Error fetching client logins:", error);
      res.status(500).json({ error: "Failed to fetch client logins" });
    }
  });

  app.get("/api/admin/client-360/:email", (req, res) => {
    try {
      const email = req.params.email;
      
      // Get login history
      const logins = db.prepare("SELECT * FROM client_logins WHERE email = ? ORDER BY login_time DESC").all(email);
      
      // Get property listings (submissions)
      const listings = db.prepare("SELECT * FROM submissions WHERE email = ?").all(email);
      
      // Get enquiries on user listings
      // First, get all property IDs from the user's listings
      const propertyIds = listings.map((l: any) => l.id);
      let enquiriesOnListings = [];
      if (propertyIds.length > 0) {
        const placeholders = propertyIds.map(() => '?').join(',');
        enquiriesOnListings = db.prepare(`SELECT * FROM enquiries WHERE property_id IN (${placeholders}) ORDER BY created_at DESC`).all(...propertyIds);
      }

      // Get enquiries made BY the user
      const enquiriesMade = db.prepare("SELECT * FROM enquiries WHERE email = ? ORDER BY created_at DESC").all(email);

      res.json({
        logins,
        listings: listings.map((l: any) => ({ ...l, details: JSON.parse(l.details || '{}') })),
        enquiriesOnListings,
        enquiriesMade
      });
    } catch (error) {
      console.error("Error fetching client 360 view:", error);
      res.status(500).json({ error: "Failed to fetch client 360 view" });
    }
  });

  app.post("/api/enquiries", (req, res) => {
    try {
      const { client_name, phone, email, property_id, property_name, property_type, location, enquiry_type, source } = req.body;
      
      // Validate property_id
      if (property_id) {
        const projectExists = db.prepare("SELECT 1 FROM projects WHERE id = ?").get(property_id);
        const submissionExists = db.prepare("SELECT 1 FROM submissions WHERE id = ?").get(property_id);
        
        if (!projectExists && !submissionExists) {
          return res.status(400).json({ error: "Invalid property_id. Property does not exist." });
        }
      }

      const insert = db.prepare(`
        INSERT INTO enquiries (id, client_name, phone, email, property_id, property_name, property_type, location, enquiry_type, source, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const id = Date.now().toString();
      const result = insert.run(id, client_name, phone, email, property_id, property_name, property_type, location, enquiry_type, source || 'Website', 'New');
      
      // Emit socket event to admin
      io.to("admin").emit("new-notification", {
        id: Date.now(),
        type: "new-enquiry",
        title: "New Enquiry Received",
        message: `${client_name} enquired about ${property_name}.`,
        time: "Just now",
        unread: true,
        icon: "Inbox",
        color: "amber"
      });

      res.json({ success: true, id });
    } catch (error) {
      console.error("Error creating enquiry:", error);
      res.status(500).json({ error: "Failed to create enquiry" });
    }
  });

  app.get("/api/admin/sales-team", (req, res) => {
    try {
      const sales = [
        { id: 's1', name: 'Alex Johnson', region: 'North', activeLeads: 12 },
        { id: 's2', name: 'Sarah Williams', region: 'South', activeLeads: 8 },
        { id: 's3', name: 'Mike Davis', region: 'East', activeLeads: 15 },
      ];
      res.json({ sales });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales team" });
    }
  });

  app.get("/api/admin/partners", (req, res) => {
    try {
      const partners = [
        { id: 'p1', name: 'Rahul Sharma', location: 'Downtown', expertise: 'Residential' },
        { id: 'p2', name: 'Priya Patel', location: 'Suburbs', expertise: 'Commercial' },
      ];
      res.json({ partners });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.post("/api/admin/enquiries/:id/assign", (req, res) => {
    try {
      const { id } = req.params;
      const { salesId, salesName, partnerId, partnerName, notes } = req.body;
      
      const update = db.prepare(`
        UPDATE enquiries 
        SET assigned_sales_id = ?, assigned_sales_name = ?, 
            assigned_partner_id = ?, assigned_partner_name = ?, 
            status = 'Assigned', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      update.run(salesId || null, salesName || null, partnerId || null, partnerName || null, id);
      
      if (notes) {
        const updateNotes = db.prepare("UPDATE enquiries SET admin_notes = ? WHERE id = ?");
        updateNotes.run(notes, id);
      }

      const insertTimeline = db.prepare(`
        INSERT INTO enquiry_timeline (id, enquiry_id, action, details, created_by)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      let details = [];
      if (salesName) details.push(`Assigned to Sales: ${salesName}`);
      if (partnerName) details.push(`Assigned to Partner: ${partnerName}`);
      
      insertTimeline.run(Date.now().toString(), id, 'Assigned', details.join(', '), 'Admin');

      const enquiry = db.prepare("SELECT * FROM enquiries WHERE id = ?").get(id) as any;
      if (enquiry && enquiry.email) {
        io.to(enquiry.email).emit("enquiry-status-update", {
          id: Date.now(),
          enquiryId: id,
          title: "Enquiry Assigned",
          message: "Your enquiry has been assigned. Our team will contact you shortly.",
          status: "Assigned",
          time: "Just now",
          unread: true
        });
      }

      if (salesId) {
        io.to("pilot").emit("new-notification", {
          id: Date.now(),
          type: "lead-assigned",
          title: "New Lead Assigned",
          message: `You have been assigned a new lead: ${enquiry.client_name}`,
          time: "Just now",
          unread: true,
          icon: "UserCheck",
          color: "indigo"
        });
      }

      if (partnerId) {
        io.to("partner").emit("new-notification", {
          id: Date.now(),
          type: "enquiry-assigned",
          title: "New Enquiry Assigned",
          message: `You have been assigned a new enquiry: ${enquiry.client_name}`,
          time: "Just now",
          unread: true,
          icon: "Briefcase",
          color: "emerald"
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error assigning enquiry:", error);
      res.status(500).json({ error: "Failed to assign enquiry" });
    }
  });

  app.get("/api/enquiries/:id/timeline", (req, res) => {
    try {
      const { id } = req.params;
      const timeline = db.prepare("SELECT * FROM enquiry_timeline WHERE enquiry_id = ? ORDER BY created_at DESC").all(id);
      res.json({ timeline });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch timeline" });
    }
  });

  app.get("/api/pilot/assigned-enquiries", (req, res) => {
    try {
      const enquiries = db.prepare("SELECT * FROM enquiries WHERE assigned_sales_id IS NOT NULL ORDER BY updated_at DESC").all();
      res.json({ enquiries });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assigned enquiries" });
    }
  });

  app.get("/api/partner/assigned-enquiries", (req, res) => {
    try {
      const enquiries = db.prepare("SELECT * FROM enquiries WHERE assigned_partner_id IS NOT NULL ORDER BY updated_at DESC").all();
      res.json({ enquiries });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assigned enquiries" });
    }
  });

  app.patch("/api/enquiries/:id/status", (req, res) => {
    try {
      const { id } = req.params;
      const { status, priority } = req.body;
      
      const update = db.prepare("UPDATE enquiries SET status = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
      update.run(status, priority || null, id);
      
      const insertTimeline = db.prepare(`
        INSERT INTO enquiry_timeline (id, enquiry_id, action, details, created_by)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertTimeline.run(Date.now().toString(), id, `Status changed to ${status}`, priority ? `Priority set to ${priority}` : null, 'System');

      const enquiry = db.prepare("SELECT * FROM enquiries WHERE id = ?").get(id) as any;
      if (enquiry && enquiry.email) {
        // Emit socket event to the specific client
        io.to(enquiry.email).emit("enquiry-status-update", {
          id: Date.now(),
          enquiryId: id,
          title: "Enquiry Status Updated",
          message: `Your enquiry for ${enquiry.property_name} is now ${status}.`,
          status: status,
          time: "Just now",
          unread: true
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating enquiry status:", error);
      res.status(500).json({ error: "Failed to update enquiry status" });
    }
  });

  app.get("/api/client/enquiries", (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      // Only fetch approved enquiries for the client dashboard
      const enquiries = db.prepare("SELECT * FROM enquiries WHERE email = ? AND status = 'Approved' ORDER BY created_at DESC").all(email);
      res.json({ enquiries });
    } catch (error) {
      console.error("Error fetching client enquiries:", error);
      res.status(500).json({ error: "Failed to fetch client enquiries" });
    }
  });

  // --- End Database API Routes ---

  // --- Google Calendar Integration ---

  app.get("/api/auth/google/url", (req, res) => {
    const redirectUri = req.query.redirectUri as string;
    if (!redirectUri) {
      return res.status(400).json({ error: "redirectUri is required" });
    }
    const oauth2Client = getGoogleOAuthClient(redirectUri);
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      prompt: "consent"
    });
    res.json({ url });
  });

  app.get(["/auth/google/callback", "/auth/google/callback/"], async (req, res) => {
    const { code, state } = req.query;
    // We expect the client to pass the original redirectUri in the state, or we can reconstruct it
    // For simplicity, we can reconstruct it from the request if needed, but the client should use window.location.origin
    // We will just use the APP_URL or reconstruct it.
    // Actually, the redirect URI must match exactly what was sent.
    // Let's pass the redirectUri in the state parameter during the /api/auth/google/url call.
    
    // Wait, the client will just use window.location.origin + "/auth/google/callback"
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const redirectUri = `${protocol}://${host}/auth/google/callback`;

    try {
      const oauth2Client = getGoogleOAuthClient(redirectUri);
      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Set cookies
      res.cookie("google_access_token", tokens.access_token, {
        secure: true,
        sameSite: "none",
        httpOnly: true,
        maxAge: 3600000 // 1 hour
      });
      if (tokens.refresh_token) {
        res.cookie("google_refresh_token", tokens.refresh_token, {
          secure: true,
          sameSite: "none",
          httpOnly: true,
          maxAge: 30 * 24 * 3600000 // 30 days
        });
      }

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/calendar/events", async (req, res) => {
    const accessToken = req.cookies.google_access_token;
    const refreshToken = req.cookies.google_refresh_token;

    if (!accessToken && !refreshToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
      });

      res.json({ events: response.data.items });
    } catch (error) {
      console.error("Calendar API error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/calendar/events", async (req, res) => {
    const accessToken = req.cookies.google_access_token;
    const refreshToken = req.cookies.google_refresh_token;

    if (!accessToken && !refreshToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      const { summary, description, start, end } = req.body;

      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary,
          description,
          start: { dateTime: start },
          end: { dateTime: end },
        },
      });

      res.json({ event: response.data });
    } catch (error) {
      console.error("Calendar API error:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.get("/api/calendar/status", (req, res) => {
    const accessToken = req.cookies.google_access_token;
    const refreshToken = req.cookies.google_refresh_token;
    res.json({ connected: !!(accessToken || refreshToken) });
  });

  // --- End Google Calendar Integration ---

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist"), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.webmanifest') || filePath.endsWith('manifest.json')) {
          res.setHeader('Content-Type', 'application/manifest+json');
        }
      }
    }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
