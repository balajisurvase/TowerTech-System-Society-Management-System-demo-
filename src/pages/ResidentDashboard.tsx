import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { submitComplaint, sendEmergencyAlert, bookAmenity } from '../lib/db';
import { 
  LayoutGrid, 
  CreditCard, 
  MessageSquare, 
  Calendar, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Send,
  Camera,
  MapPin,
  History,
  Building2,
  ShieldAlert
} from 'lucide-react';

const ResidentDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  
  // Form states
  const [complaintForm, setComplaintForm] = useState({ title: '', description: '' });
  const [bookingForm, setBookingForm] = useState({ amenity: 'Clubhouse', date: '', timeSlot: 'Morning (9 AM - 12 PM)' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!profile) return;

    const unsubBills = onSnapshot(
      query(collection(db, 'bills'), where('residentId', '==', profile.uid)),
      (snap) => setBills(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (error) => {
        console.error("Bills fetch error:", error);
        if (error.message.includes("permissions")) {
          const errInfo = {
            error: error.message,
            operation: 'list',
            path: 'bills',
            uid: profile.uid,
            query: `residentId == ${profile.uid}`
          };
          console.error('Firestore Permission Error: ', JSON.stringify(errInfo));
        }
      }
    );

    const unsubComplaints = onSnapshot(
      query(collection(db, 'complaints'), where('residentId', '==', profile.uid)),
      (snap) => setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubBookings = onSnapshot(
      query(collection(db, 'bookings'), where('residentId', '==', profile.uid)),
      (snap) => setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubNotices = onSnapshot(collection(db, 'notices'), (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubBills();
      unsubComplaints();
      unsubBookings();
      unsubEvents();
      unsubNotices();
    };
  }, [profile]);

  const handleEmergency = async (type: string) => {
    if (!profile) return;
    try {
      await sendEmergencyAlert(profile.uid, profile.name, profile.tower!, profile.flatNumber!, type);
      alert("Emergency alert sent to Admin!");
    } catch (err) {
      console.error(err);
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Flat Details Header */}
      <div className="bg-gradient-to-r from-[#2563EB] to-[#1E3A8A] p-8 rounded-[10px] text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2">Welcome Home</p>
            <h2 className="text-3xl font-bold mb-3">{profile?.name}</h2>
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
                <Building2 size={16} /> Tower {profile?.tower}
              </span>
              <span className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
                <LayoutGrid size={16} /> Flat {profile?.flatNumber}
              </span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-[10px] border border-white/10 min-w-[200px]">
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-2">Maintenance Status</p>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${bills.some(b => b.status === 'UNPAID') ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`}></div>
              <span className="text-xl font-bold">
                {bills.some(b => b.status === 'UNPAID') ? 'Payment Pending' : 'Up to Date'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Due Amount', value: `₹${bills.filter(b => b.status === 'UNPAID').reduce((acc, b) => acc + b.amount, 0)}`, icon: CreditCard, color: 'rose' },
          { label: 'Active Complaints', value: complaints.filter(c => c.status !== 'RESOLVED').length, icon: MessageSquare, color: 'amber' },
          { label: 'Upcoming Events', value: events.length, icon: Calendar, color: 'purple' },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-[#1F2937] p-6 rounded-[10px] shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded-lg text-${item.color}-600`}>
                <item.icon size={24} />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notices */}
        <div className="bg-white dark:bg-[#1F2937] rounded-[10px] shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Society Notices</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {notices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No recent notices</div>
            ) : (
              notices.map(notice => (
                <div key={notice.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    {notice.priority === 'HIGH' && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                    <p className="font-bold text-gray-900 dark:text-white">{notice.title}</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{notice.content}</p>
                  <p className="text-[10px] text-gray-400 mt-2">{new Date(notice.date?.toDate()).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Emergency Panel */}
        <div className="bg-white dark:bg-[#1F2937] rounded-[10px] shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <ShieldAlert className="text-rose-600" />
            Quick Emergency Alert
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { type: 'Water Shortage', icon: '💧' },
              { type: 'Power Outage', icon: '⚡' },
              { type: 'Lift Breakdown', icon: '🛗' },
              { type: 'Medical', icon: '🚑' },
            ].map(item => (
              <button
                key={item.type}
                onClick={() => handleEmergency(item.type)}
                className="p-4 rounded-[10px] border border-rose-100 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all text-center group"
              >
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-xs font-bold text-rose-600">{item.type}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const MaintenanceView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Maintenance Bills</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock size={16} />
          Last updated: Today
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {bills.length === 0 ? (
          <div className="bg-white dark:bg-[#1F2937] p-12 text-center rounded-[10px] border border-gray-100 dark:border-gray-700">
            <CreditCard className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No bills found</p>
          </div>
        ) : (
          bills.map((bill) => (
            <div key={bill.id} className="bg-white dark:bg-[#1F2937] p-6 rounded-[10px] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${bill.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{bill.month} Maintenance</h4>
                  <p className="text-xs text-gray-500">Due Date: {bill.dueDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">₹{bill.amount}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${bill.status === 'PAID' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {bill.status}
                  </span>
                </div>
                {bill.status === 'UNPAID' && (
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 dark:shadow-none">
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const ComplaintsView = () => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profile) return;
      setLoading(true);
      try {
        await submitComplaint(profile.uid, profile.name, profile.tower!, profile.flatNumber!, complaintForm.title, complaintForm.description);
        setComplaintForm({ title: '', description: '' });
        setMessage({ type: 'success', text: 'Complaint submitted successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to submit complaint.' });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1F2937] p-6 rounded-[10px] border border-gray-100 dark:border-gray-700 sticky top-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">New Complaint</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Subject</label>
                <input 
                  type="text" 
                  required
                  value={complaintForm.title}
                  onChange={(e) => setComplaintForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Water Leakage"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your issue..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Send size={18} />
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
              {message.text && (
                <p className={`text-center text-xs font-bold ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {message.text}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Complaint History</h3>
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className="bg-white dark:bg-[#1F2937] p-12 text-center rounded-[10px] border border-gray-100 dark:border-gray-700">
                <History className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No history found</p>
              </div>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="bg-white dark:bg-[#1F2937] p-6 rounded-[10px] border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900 dark:text-white">{c.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-600' : 
                      c.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{c.description}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Clock size={12} />
                    {new Date(c.createdAt?.toDate()).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const BookingsView = () => {
    const handleBooking = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profile) return;
      setLoading(true);
      try {
        await bookAmenity(profile.uid, profile.name, bookingForm.amenity, bookingForm.date, bookingForm.timeSlot);
        setMessage({ type: 'success', text: 'Booking request sent!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Booking failed.' });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1F2937] p-6 rounded-[10px] border border-gray-100 dark:border-gray-700 sticky top-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Book Amenity</h3>
            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Select Amenity</label>
                <select 
                  value={bookingForm.amenity}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, amenity: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option>Clubhouse</option>
                  <option>Swimming Pool</option>
                  <option>Gym</option>
                  <option>Garden Area</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Date</label>
                <input 
                  type="date" 
                  required
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Time Slot</label>
                <select 
                  value={bookingForm.timeSlot}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, timeSlot: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option>Morning (9 AM - 12 PM)</option>
                  <option>Afternoon (1 PM - 4 PM)</option>
                  <option>Evening (5 PM - 8 PM)</option>
                  <option>Night (8 PM - 11 PM)</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Calendar size={18} />
                {loading ? 'Checking...' : 'Reserve Slot'}
              </button>
              {message.text && (
                <p className={`text-center text-xs font-bold ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {message.text}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">My Bookings</h3>
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="bg-white dark:bg-[#1F2937] p-12 text-center rounded-[10px] border border-gray-100 dark:border-gray-700">
                <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No bookings found</p>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="bg-white dark:bg-[#1F2937] p-6 rounded-[10px] border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{b.amenity}</h4>
                        <p className="text-xs text-gray-500">{b.date} • {b.timeSlot}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      b.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 
                      b.status === 'REJECTED' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const EventsView = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Society Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#1F2937] p-12 text-center rounded-[10px] border border-gray-100 dark:border-gray-700">
            <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No upcoming events</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white dark:bg-[#1F2937] rounded-[10px] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="h-3 bg-blue-600"></div>
              <div className="p-6">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{event.name}</h4>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="text-sm font-medium">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Clock size={16} className="text-blue-600" />
                    <span className="text-sm font-medium">{event.time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <MapPin size={16} className="text-blue-600" />
                    <span className="text-sm font-medium">{event.location}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{event.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const AlertView = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <div className="inline-flex p-4 bg-rose-50 text-rose-600 rounded-full mb-4">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Emergency Assistance</h2>
        <p className="text-gray-500 mt-2">In case of any emergency, use the buttons below to alert the society administration and security immediately.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { type: 'Medical Emergency', icon: '🚑', color: 'rose', desc: 'Need immediate medical help' },
          { type: 'Fire Emergency', icon: '🔥', color: 'orange', desc: 'Fire or smoke detected' },
          { type: 'Security Threat', icon: '👮', color: 'blue', desc: 'Suspicious activity or threat' },
          { type: 'Gas Leakage', icon: '💨', color: 'amber', desc: 'Smell of gas in flat/floor' },
        ].map(item => (
          <button
            key={item.type}
            onClick={() => handleEmergency(item.type)}
            className="p-6 rounded-[10px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-[#1F2937] hover:border-rose-500 dark:hover:border-rose-500 transition-all text-left group shadow-sm"
          >
            <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">{item.icon}</span>
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.type}</h4>
            <p className="text-xs text-gray-500">{item.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-[10px]">
        <div className="flex gap-4">
          <AlertTriangle className="text-amber-600 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">Important Note</h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">False alerts may lead to penalties. Please use these buttons only in case of genuine emergencies.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={renderOverview()} />
      <Route path="/maintenance" element={<MaintenanceView />} />
      <Route path="/complaints" element={<ComplaintsView />} />
      <Route path="/events" element={<EventsView />} />
      <Route path="/bookings" element={<BookingsView />} />
      <Route path="/alert" element={<AlertView />} />
    </Routes>
  );
};

export default ResidentDashboard;
