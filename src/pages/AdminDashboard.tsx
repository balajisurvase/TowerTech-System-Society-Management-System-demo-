import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, updateDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { initializeFlats, approveResident, updateComplaintStatus, createMaintenanceBills } from '../lib/db';
import { 
  Users, 
  CreditCard, 
  MessageSquare, 
  Calendar, 
  AlertTriangle, 
  LayoutGrid,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  ChevronRight,
  ShieldAlert,
  FileText,
  Plus,
  MapPin
} from 'lucide-react';

import { initializeDemoData, ensureAdminProfile } from '../lib/demoData';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [stats, setStats] = useState({
    residents: 0,
    paidBills: 0,
    unpaidBills: 0,
    complaints: 0,
    alerts: 0,
    events: 0
  });
  const [flats, setFlats] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [filterTower, setFilterTower] = useState('All');

  useEffect(() => {
    initializeFlats();
    initializeDemoData();
    if (user) ensureAdminProfile(user.uid, user.email!);

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, residents: snap.docs.filter(d => d.data().role === 'RESIDENT' && d.data().status === 'APPROVED').length }));
      setPendingUsers(snap.docs.filter(d => d.data().status === 'PENDING').map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubFlats = onSnapshot(collection(db, 'flats'), (snap) => {
      const allFlats = snap.docs.map(d => d.data());
      setFlats(allFlats);
      setStats(prev => ({
        ...prev,
        paidBills: allFlats.filter(f => f.paymentStatus === 'PAID').length,
        unpaidBills: allFlats.filter(f => f.paymentStatus === 'UNPAID').length
      }));
    });

    const unsubComplaints = onSnapshot(collection(db, 'complaints'), (snap) => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(prev => ({ ...prev, complaints: snap.docs.filter(d => d.data().status === 'PENDING').length }));
    });

    const unsubAlerts = onSnapshot(collection(db, 'alerts'), (snap) => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(prev => ({ ...prev, alerts: snap.docs.filter(d => d.data().status === 'ACTIVE').length }));
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(prev => ({ ...prev, events: snap.docs.length }));
    });

    return () => {
      unsubUsers();
      unsubFlats();
      unsubComplaints();
      unsubAlerts();
      unsubEvents();
    };
  }, [user]);

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Residents', value: stats.residents, icon: Users, color: 'blue' },
          { label: 'Paid Maintenance', value: stats.paidBills, icon: CheckCircle2, color: 'emerald' },
          { label: 'Pending Maintenance', value: stats.unpaidBills, icon: CreditCard, color: 'rose' },
          { label: 'Total Complaints', value: stats.complaints, icon: MessageSquare, color: 'amber' },
          { label: 'Upcoming Events', value: stats.events, icon: Calendar, color: 'purple' },
          { label: 'Emergency Alerts', value: stats.alerts, icon: ShieldAlert, color: 'red' },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-[#1F2937] p-5 rounded-[10px] shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded-lg text-${item.color}-600`}>
                <item.icon size={20} />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{item.value}</span>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Approvals */}
        <div className="bg-white dark:bg-[#1F2937] rounded-[10px] shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pending Approvals</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">{pendingUsers.length}</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {pendingUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No pending requests</div>
            ) : (
              pendingUsers.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{u.name}</p>
                    <p className="text-xs text-gray-500">Tower {u.tower} • Flat {u.flatNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => approveResident(u.id, `${u.tower}-${u.flatNumber}`, u.name)}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all">
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white dark:bg-[#1F2937] rounded-[10px] shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Emergency Alerts</h3>
            <AlertTriangle className="text-rose-500" size={20} />
          </div>
          <div className="p-6 space-y-4">
            {alerts.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No active alerts</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">{alert.type}</span>
                    <span className="text-[10px] text-rose-400">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-rose-900 dark:text-rose-200">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ResidentsView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#1F2937] p-4 rounded-[10px] border border-gray-100 dark:border-gray-700">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search residents..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={18} className="text-gray-400" />
          <select 
            value={filterTower}
            onChange={(e) => setFilterTower(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Towers</option>
            <option value="A">Tower A</option>
            <option value="B">Tower B</option>
            <option value="C">Tower C</option>
            <option value="D">Tower D</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1F2937] rounded-[10px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Resident</th>
              <th className="px-6 py-4">Flat</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {flats
              .filter(f => filterTower === 'All' || f.tower === filterTower)
              .map((flat) => (
                <tr key={flat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900 dark:text-white">{flat.residentName || 'Vacant'}</p>
                    <p className="text-xs text-gray-500">{flat.residentId ? 'Verified Resident' : 'No occupant'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">
                      {flat.number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${flat.residentId ? 'text-emerald-500' : 'text-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${flat.residentId ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                      {flat.residentId ? 'Occupied' : 'Vacant'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {flat.residentId ? 'Jan 2024' : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const BillingView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Maintenance Billing</h2>
        <button 
          onClick={() => {
            setLoading(true);
            // Simulate generating bills for all flats
            setTimeout(() => setLoading(false), 1500);
          }}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <CreditCard size={18} />
          {loading ? 'Generating...' : 'Generate Monthly Bills'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-[10px] border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Collection</p>
          <p className="text-3xl font-bold text-emerald-600">₹2,80,000</p>
        </div>
        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-[10px] border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pending Amount</p>
          <p className="text-3xl font-bold text-rose-600">₹45,000</p>
        </div>
        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-[10px] border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Collection Rate</p>
          <p className="text-3xl font-bold text-blue-600">86%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1F2937] rounded-[10px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Flat</th>
              <th className="px-6 py-4">Resident</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {flats.slice(0, 10).map((flat) => (
              <tr key={flat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all">
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{flat.number}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{flat.residentName}</td>
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">₹2,500</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    flat.paymentStatus === 'PAID' 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : 'bg-rose-100 text-rose-600'
                  }`}>
                    {flat.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 text-xs font-bold hover:underline">Send Reminder</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ComplaintsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resident Complaints</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold">All</button>
          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Pending</button>
          <button className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold">Resolved</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {complaints.length === 0 ? (
          <div className="bg-white dark:bg-[#1F2937] p-12 text-center rounded-[10px] border border-gray-100 dark:border-gray-700">
            <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No complaints found</p>
          </div>
        ) : (
          complaints.map((c) => (
            <div key={c.id} className="bg-white dark:bg-[#1F2937] p-6 rounded-[10px] border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">{c.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-600' : 
                      c.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">From: {c.residentName} ({c.flatNumber}) • {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  {c.status !== 'RESOLVED' && (
                    <>
                      <button 
                        onClick={() => updateComplaintStatus(c.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all"
                      >
                        Start Work
                      </button>
                      <button 
                        onClick={() => updateComplaintStatus(c.id, 'RESOLVED')}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                {c.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const EventsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Society Events</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2">
          <Plus size={18} />
          Add New Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white dark:bg-[#1F2937] rounded-[10px] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm group">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 flex flex-col justify-end">
              <h4 className="text-xl font-bold text-white">{event.name}</h4>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar size={16} />
                  <span className="text-xs font-bold">{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock size={16} />
                  <span className="text-xs font-bold">{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin size={16} />
                  <span className="text-xs font-bold">{event.location}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">{event.description}</p>
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-100 transition-all">Edit</button>
                <button className="flex-1 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AlertsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Emergency Alerts</h2>
        <button className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 transition-all flex items-center gap-2">
          <ShieldAlert size={18} />
          Broadcast Alert
        </button>
      </div>

      <div className="bg-white dark:bg-[#1F2937] rounded-[10px] border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {alerts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No active alerts</div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="p-6 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">{alert.type}</h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{alert.message}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">Reported by: <span className="font-bold text-gray-700 dark:text-gray-300">{alert.residentName || 'System'} ({alert.flatNumber || 'All'})</span></span>
                    <button className="text-xs font-bold text-emerald-600 hover:underline">Mark as Resolved</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const BookingsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Amenity Bookings</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Pending</button>
          <button className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold">Approved</button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1F2937] rounded-[10px] border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Resident</th>
              <th className="px-6 py-4">Amenity</th>
              <th className="px-6 py-4">Date & Slot</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {[
              { id: 1, name: 'Rahul Sharma', flat: 'A-101', amenity: 'Clubhouse', date: '2026-08-15', slot: 'Evening', status: 'PENDING' },
              { id: 2, name: 'Priya Patil', flat: 'B-302', amenity: 'Garden Area', date: '2026-08-20', slot: 'Morning', status: 'APPROVED' },
            ].map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 dark:text-white">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.flat}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{b.amenity}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{b.date} • {b.slot}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    b.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-all">
                      <CheckCircle2 size={16} />
                    </button>
                    <button className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 transition-all">
                      <XCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ReportsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Financial Reports</h2>
        <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2">
          <FileText size={18} />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-[10px] border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Monthly Collection Trend</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {[45, 60, 55, 80, 75, 90].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-blue-500/20 hover:bg-blue-500 transition-all rounded-t-lg"
                  style={{ height: `${h}%` }}
                ></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-[10px] border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Expense Distribution</h3>
          <div className="space-y-4">
            {[
              { label: 'Security Services', value: 40, color: 'blue' },
              { label: 'Maintenance & Repairs', value: 30, color: 'emerald' },
              { label: 'Electricity & Water', value: 20, color: 'amber' },
              { label: 'Staff Salaries', value: 10, color: 'purple' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className="text-gray-900 dark:text-white">{item.value}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-${item.color}-500`}
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={renderOverview()} />
      <Route path="/residents" element={<ResidentsView />} />
      <Route path="/billing" element={<BillingView />} />
      <Route path="/complaints" element={<ComplaintsView />} />
      <Route path="/events" element={<EventsView />} />
      <Route path="/bookings" element={<BookingsView />} />
      <Route path="/reports" element={<ReportsView />} />
      <Route path="/alerts" element={<AlertsView />} />
    </Routes>
  );
};

export default AdminDashboard;
