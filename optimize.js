import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/components/SuperAdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Extract hardcoded arrays to the top level
const howzersData = `
const HOWZERS_DATA = [
  { name: "Howzy Hyderabad", owner: "Kiran Reddy", agents: 450, revenue: "₹4.2 Cr", status: "Active" },
  { name: "Howzy Bangalore", owner: "Anitha Rao", agents: 320, revenue: "₹3.8 Cr", status: "Active" },
  { name: "Howzy Chennai", owner: "Vijay Kumar", agents: 210, revenue: "₹2.1 Cr", status: "Active" },
  { name: "Howzy Pune", owner: "Sanjay Patil", agents: 180, revenue: "₹1.5 Cr", status: "Pending" },
  { name: "Howzy Vizag", owner: "Ravi Teja", agents: 80, revenue: "₹0.8 Cr", status: "Active" },
];
`;

const partnersData = `
const PARTNERS_DATA = [
  { name: "Rahul Sharma", franchise: "Hyderabad", status: "Active", deals: 24, earnings: "₹12.5L" },
  { name: "Priya Singh", franchise: "Bangalore", status: "Active", deals: 18, earnings: "₹8.2L" },
  { name: "Amit Patel", franchise: "Pune", status: "Inactive", deals: 5, earnings: "₹1.5L" },
  { name: "Sneha Reddy", franchise: "Hyderabad", status: "Active", deals: 32, earnings: "₹18.4L" },
  { name: "Vikram Rao", franchise: "Chennai", status: "Active", deals: 12, earnings: "₹4.8L" },
];
`;

if (!content.includes('HOWZERS_DATA')) {
  content = content.replace('const MOCK_NOTIFICATIONS = [', howzersData + '\n' + partnersData + '\nconst MOCK_NOTIFICATIONS = [');
}

// Replace in PartnerManagement
content = content.replace(/\{\[\s*\{\s*name:\s*"Howzy Hyderabad"[\s\S]*?\]\.map\(\(franchise, i\)/, 'HOWZERS_DATA.map((franchise, i)');

// Replace in PilotManagement
content = content.replace(/\{\[\s*\{\s*name:\s*"Rahul Sharma"[\s\S]*?\]\.map\(\(agent, i\)/, 'PARTNERS_DATA.map((agent, i)');

// 2. Wrap components in React.memo
content = content.replace(/function StatCard\(\{ title/g, 'const StatCard = React.memo(function StatCard({ title');
content = content.replace(/<\/motion\.div>\s*\);\s*\}/g, '</motion.div>\n  );\n});');

content = content.replace(/function AdminOverview\(\) \{/g, 'const AdminOverview = React.memo(function AdminOverview() {');
content = content.replace(/function PartnerManagement\(\) \{/g, 'const PartnerManagement = React.memo(function PartnerManagement() {');
content = content.replace(/function PilotManagement\(\) \{/g, 'const PilotManagement = React.memo(function PilotManagement() {');
content = content.replace(/function AllPropertiesView\(\{ type, data \}: \{ type: string, data: any\[\] \}\) \{/g, 'const AllPropertiesView = React.memo(function AllPropertiesView({ type, data }: { type: string, data: any[] }) {');
content = content.replace(/function GlobalLeadsView\(\) \{/g, 'const GlobalLeadsView = React.memo(function GlobalLeadsView() {');
content = content.replace(/function MessagesAndAlertsView\(\{ onBroadcast \}: \{ onBroadcast: \(notif: any\) => void \}\) \{/g, 'const MessagesAndAlertsView = React.memo(function MessagesAndAlertsView({ onBroadcast }: { onBroadcast: (notif: any) => void }) {');
content = content.replace(/function SystemSettings\(\) \{/g, 'const SystemSettings = React.memo(function SystemSettings() {');

// Fix closing braces for memoized components
// Since we replaced `function Name() {` with `const Name = React.memo(function Name() {`, we need to replace the closing `}` with `});`
// We can do this by finding the end of each function.
// Let's use a simpler approach: just replace the specific end patterns.
content = content.replace(/<\/div>\s*\);\s*\}\s*function StatCard/g, '</div>\n  );\n});\n\nconst StatCard');
content = content.replace(/<\/div>\s*\);\s*\}\s*function PartnerManagement/g, '</div>\n  );\n});\n\nconst PartnerManagement');
content = content.replace(/<\/div>\s*\);\s*\}\s*function PilotManagement/g, '</div>\n  );\n});\n\nconst PilotManagement');
content = content.replace(/<\/div>\s*\);\s*\}\s*function AllPropertiesView/g, '</div>\n  );\n});\n\nconst AllPropertiesView');
content = content.replace(/<\/div>\s*\);\s*\}\s*function GlobalLeadsView/g, '</div>\n  );\n});\n\nconst GlobalLeadsView');
content = content.replace(/<\/div>\s*\);\s*\}\s*function SystemSettings/g, '</div>\n  );\n});\n\nconst SystemSettings');
content = content.replace(/<\/div>\s*\);\s*\}\s*$/, '</div>\n  );\n});\n');

// 3. Add useMemo to tabs array
content = content.replace(/const tabs = \[/g, 'const tabs = React.useMemo(() => [');
content = content.replace(/\{ id: 'settings', label: 'System Settings', icon: Settings \},\s*\];/g, '{ id: \'settings\', label: \'System Settings\', icon: Settings },\n  ], []);');

// 4. Optimize PilotManagement search
content = content.replace(/const PilotManagement = React.memo\(function PilotManagement\(\) \{/g, `const PilotManagement = React.memo(function PilotManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredPartners = React.useMemo(() => {
    return PARTNERS_DATA.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.franchise.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);
`);
content = content.replace(/<input type="text" placeholder="Search partners\.\.\." className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm" \/>/g, '<input type="text" placeholder="Search partners..." className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />');
content = content.replace(/PARTNERS_DATA\.map\(\(agent, i\)/g, 'filteredPartners.map((agent, i)');

// 5. Optimize AllPropertiesView data
content = content.replace(/const AllPropertiesView = React\.memo\(function AllPropertiesView\(\{ type, data \}: \{ type: string, data: any\[\] \}\) \{/g, `const AllPropertiesView = React.memo(function AllPropertiesView({ type, data }: { type: string, data: any[] }) {
  const displayData = React.useMemo(() => data.slice(0, 8), [data]);
`);
content = content.replace(/data\.slice\(0, 8\)\.map\(\(item, i\)/g, 'displayData.map((item, i)');

// 6. Optimize GlobalLeadsView data
content = content.replace(/const GlobalLeadsView = React\.memo\(function GlobalLeadsView\(\) \{/g, `const GlobalLeadsView = React.memo(function GlobalLeadsView() {
  const displayLeads = React.useMemo(() => LEADS.slice(0, 10), []);
`);
content = content.replace(/LEADS\.map\(\(lead, i\)/g, 'displayLeads.map((lead, i)');

// 7. Memoize handleBroadcast
content = content.replace(/const handleBroadcast = \(notification: any\) => \{/g, 'const handleBroadcast = React.useCallback((notification: any) => {');
content = content.replace(/socketRef\.current\.emit\('send-broadcast', notification\);\s*\}\s*\};/g, 'socketRef.current.emit(\'send-broadcast\', notification);\n    }\n  }, []);');

// 8. Add useMemo to SuperAdminDashboard active tab component
content = content.replace(/\{activeTab === 'overview' && <AdminOverview \/>\}[\s\S]*?\{activeTab === 'settings' && <SystemSettings \/>\}/g, `
              {React.useMemo(() => {
                switch (activeTab) {
                  case 'overview': return <AdminOverview />;
                  case 'partners': return <PartnerManagement />;
                  case 'builders': return <PilotManagement />;
                  case 'projects': return <AllPropertiesView type="Projects" data={LISTED_PROJECTS} />;
                  case 'plots': return <AllPropertiesView type="Plots" data={LISTED_PLOTS} />;
                  case 'farmlands': return <AllPropertiesView type="Farm Lands" data={LISTED_FARM_LANDS} />;
                  case 'leads': return <GlobalLeadsView />;
                  case 'alerts': return <MessagesAndAlertsView onBroadcast={handleBroadcast} />;
                  case 'settings': return <SystemSettings />;
                  default: return null;
                }
              }, [activeTab, handleBroadcast])}
`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Optimized SuperAdminDashboard.tsx');
