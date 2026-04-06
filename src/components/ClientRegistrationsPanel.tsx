import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Users, Phone, Mail, Clock, Tag, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface ClientProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  lookingFor: string[];
  contactTime: string;
  createdAt?: { seconds: number } | null;
}

const LOOKING_FOR_COLORS: Record<string, string> = {
  'New Property': 'bg-indigo-100 text-indigo-700',
  'Lands': 'bg-emerald-100 text-emerald-700',
  'Villas': 'bg-purple-100 text-purple-700',
  'ReSale Properties': 'bg-amber-100 text-amber-700',
  'Commercial Properties': 'bg-rose-100 text-rose-700',
};

function formatDate(ts?: { seconds: number } | null): string {
  if (!ts?.seconds) return '—';
  return new Date(ts.seconds * 1000).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isNewRegistration(ts?: { seconds: number } | null): boolean {
  if (!ts?.seconds) return false;
  return Date.now() - ts.seconds * 1000 < 24 * 60 * 60 * 1000; // last 24h
}

type SortField = 'createdAt' | 'name';

export default function ClientRegistrationsPanel() {
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'client_profiles'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setProfiles(snap.docs.map(d => d.data() as ClientProfile));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const filtered = profiles
    .filter(p => {
      const term = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(term) ||
        p.phone?.includes(term) ||
        p.email?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortField === 'createdAt') {
        const at = a.createdAt?.seconds ?? 0;
        const bt = b.createdAt?.seconds ?? 0;
        return sortAsc ? at - bt : bt - at;
      }
      return sortAsc
        ? (a.name ?? '').localeCompare(b.name ?? '')
        : (b.name ?? '').localeCompare(a.name ?? '');
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(s => !s);
    else { setSortField(field); setSortAsc(true); }
  };

  const todayCount = profiles.filter(p => isNewRegistration(p.createdAt)).length;

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total Registrations</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{profiles.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">New Today</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{todayCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm col-span-2 md:col-span-1">
          <p className="text-xs text-slate-500 font-medium">Top Interest</p>
          <p className="text-sm font-bold text-indigo-700 mt-1 truncate">
            {(() => {
              const counts: Record<string, number> = {};
              profiles.forEach(p => p.lookingFor?.forEach(l => { counts[l] = (counts[l] ?? 0) + 1; }));
              const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
              return top ? `${top[0]} (${top[1]})` : '—';
            })()}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>
        <div className="text-xs text-slate-400 whitespace-nowrap">
          {loading ? (
            <span className="flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading…</span>
          ) : (
            `${filtered.length} of ${profiles.length}`
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 font-semibold text-slate-600 hover:text-indigo-600 text-xs uppercase tracking-wide">
                    <Users className="w-3.5 h-3.5" /> Name
                    {sortField === 'name' ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="flex items-center gap-1 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </span>
                </th>
                <th className="px-4 py-3 text-left hidden md:table-cell">
                  <span className="flex items-center gap-1 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </span>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <span className="flex items-center gap-1 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    <Tag className="w-3.5 h-3.5" /> Looking For
                  </span>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <span className="flex items-center gap-1 font-semibold text-slate-600 text-xs uppercase tracking-wide">
                    <Clock className="w-3.5 h-3.5" /> Contact Time
                  </span>
                </th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 font-semibold text-slate-600 hover:text-indigo-600 text-xs uppercase tracking-wide">
                    Registered
                    {sortField === 'createdAt' ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading registrations…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No client registrations found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <>
                      <motion.tr
                        key={p.uid}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        onClick={() => setExpandedUid(expandedUid === p.uid ? null : p.uid)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                              {(p.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{p.name || '—'}</p>
                              {isNewRegistration(p.createdAt) && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">NEW</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{p.phone || '—'}</td>
                        <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{p.email || '—'}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {p.lookingFor?.map(l => (
                              <span key={l} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LOOKING_FOR_COLORS[l] ?? 'bg-slate-100 text-slate-600'}`}>
                                {l}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{p.contactTime || '—'}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(p.createdAt)}</td>
                      </motion.tr>
                      {expandedUid === p.uid && (
                        <tr key={`${p.uid}-expanded`} className="bg-indigo-50/40">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div><p className="text-slate-400 font-medium mb-1">Phone</p><p className="font-semibold text-slate-800">{p.phone || '—'}</p></div>
                              <div><p className="text-slate-400 font-medium mb-1">Email</p><p className="font-semibold text-slate-800">{p.email || '—'}</p></div>
                              <div><p className="text-slate-400 font-medium mb-1">Contact Time</p><p className="font-semibold text-slate-800">{p.contactTime || '—'}</p></div>
                              <div><p className="text-slate-400 font-medium mb-1">Looking For</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {p.lookingFor?.map(l => (
                                    <span key={l} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LOOKING_FOR_COLORS[l] ?? 'bg-slate-100 text-slate-600'}`}>{l}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
