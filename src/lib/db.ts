import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

const INDIAN_NAMES = [
  "Rahul Sharma", "Priya Patil", "Amit Kulkarni", "Sneha Deshmukh", 
  "Arjun Verma", "Anjali Gupta", "Vivek Mehta", "Neha Sharma",
  "Suresh Raina", "Deepika Padukone", "Arjun Kapoor", "Kriti Sanon",
  "Vikram Singh", "Pooja Hegde", "Sanjay Dutt", "Aditi Rao"
];

export const initializeFlats = async () => {
  const flatsRef = collection(db, 'flats');
  const snapshot = await getDocs(flatsRef);
  
  if (snapshot.empty) {
    console.log("Initializing 112 flats and residents...");
    const batch = writeBatch(db);
    const towers = ['A', 'B', 'C', 'D'];
    const floors = 7;
    const flatsPerFloor = 4;

    let residentCount = 0;

    for (const tower of towers) {
      for (let floor = 1; floor <= floors; floor++) {
        for (let flatNum = 1; flatNum <= flatsPerFloor; flatNum++) {
          const number = `${tower}-${floor}0${flatNum}`;
          const flatId = number;
          const flatRef = doc(db, 'flats', flatId);
          
          const nameIndex = residentCount % INDIAN_NAMES.length;
          const name = INDIAN_NAMES[nameIndex];
          
          // 60% Paid, 40% Unpaid
          const paymentStatus = residentCount % 10 < 6 ? 'PAID' : 'UNPAID';

          batch.set(flatRef, {
            id: flatId,
            tower,
            floor,
            number,
            residentId: `demo-user-${flatId}`,
            residentName: name,
            paymentStatus
          });

          // Create user document
          const userRef = doc(db, 'users', `demo-user-${flatId}`);
          batch.set(userRef, {
            uid: `demo-user-${flatId}`,
            name,
            email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
            phone: `987654${3210 + residentCount}`,
            tower,
            flatNumber: flatId,
            role: 'RESIDENT',
            status: 'APPROVED',
            createdAt: new Date().toISOString()
          });

          // Create maintenance bill record
          const billId = `BILL-${flatId}-JAN`;
          const billRef = doc(db, 'bills', billId);
          batch.set(billRef, {
            id: billId,
            residentId: `demo-user-${flatId}`,
            residentName: name,
            flatId: flatId,
            flatNumber: flatId,
            month: 'January',
            amount: 2500,
            dueDate: '2026-01-10',
            status: paymentStatus,
            createdAt: new Date().toISOString()
          });

          residentCount++;
        }
      }
    }

    // Add demo complaints
    const complaints = [
      {
        title: "Water Leakage in Parking",
        residentName: "Sneha Deshmukh",
        flatNumber: "A-104",
        category: "Maintenance",
        description: "There is a major water leakage in the underground parking area near slot 45.",
        status: "PENDING"
      },
      {
        title: "Lift Not Working",
        residentName: "Arjun Verma",
        flatNumber: "B-203",
        category: "Facility",
        description: "The main lift in Tower B is stuck on the 4th floor.",
        status: "IN_PROGRESS"
      }
    ];

    complaints.forEach((c, i) => {
      const ref = doc(collection(db, 'complaints'));
      batch.set(ref, { ...c, createdAt: new Date().toISOString() });
    });

    // Add demo events
    const events = [
      {
        name: "Society Annual Meeting",
        date: "2026-07-10",
        time: "10:00 AM",
        location: "Clubhouse",
        description: "Annual general body meeting to discuss society budget and maintenance."
      },
      {
        name: "Diwali Celebration",
        date: "2026-11-12",
        time: "06:00 PM",
        location: "Society Garden",
        description: "Grand Diwali celebration with lights, music, and dinner."
      }
    ];

    events.forEach((e, i) => {
      const ref = doc(collection(db, 'events'));
      batch.set(ref, { ...e, createdAt: new Date().toISOString() });
    });

    // Add demo bookings
    const bookings = [
      {
        residentName: "Rahul Sharma",
        flatNumber: "A-101",
        amenity: "Clubhouse",
        eventType: "Birthday Party",
        date: "2026-08-15",
        time: "06:00 PM",
        status: "APPROVED"
      },
      {
        residentName: "Priya Patil",
        flatNumber: "B-302",
        amenity: "Garden",
        eventType: "Family Gathering",
        date: "2026-08-20",
        time: "07:00 PM",
        status: "PENDING"
      }
    ];

    bookings.forEach((b, i) => {
      const ref = doc(collection(db, 'bookings'));
      batch.set(ref, { ...b, createdAt: new Date().toISOString() });
    });

    // Add demo emergency alert
    const alertRef = doc(collection(db, 'alerts'));
    batch.set(alertRef, {
      type: "Water Shortage",
      message: "Water supply will be unavailable from 10 AM to 2 PM for maintenance.",
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    });

    await batch.commit();
    console.log("112 Flats, residents, and demo data initialized successfully.");
  }
};

export const createMaintenanceBills = async (flatId: string, amount: number, month: string) => {
  const flatSnap = await getDoc(doc(db, 'flats', flatId));
  const residentId = flatSnap.exists() ? flatSnap.data().residentId : null;
  
  const billId = `${flatId}-${month.replace(' ', '-')}`;
  const billRef = doc(db, 'bills', billId);
  await setDoc(billRef, {
    flatId,
    residentId,
    amount,
    month,
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
    status: 'UNPAID',
    createdAt: serverTimestamp()
  });
};

export const submitComplaint = async (residentId: string, residentName: string, tower: string, flatNumber: string, title: string, description: string, mediaUrl?: string) => {
  await addDoc(collection(db, 'complaints'), {
    residentId,
    residentName,
    tower,
    flatNumber,
    title,
    description,
    mediaUrl: mediaUrl || null,
    status: 'PENDING',
    createdAt: serverTimestamp()
  });
};

export const sendEmergencyAlert = async (residentId: string, residentName: string, tower: string, flatNumber: string, type: string) => {
  await addDoc(collection(db, 'alerts'), {
    residentId,
    residentName,
    tower,
    flatNumber,
    type,
    timestamp: serverTimestamp(),
    status: 'ACTIVE'
  });
};

export const bookAmenity = async (residentId: string, residentName: string, amenity: string, date: string, timeSlot: string) => {
  // Check for double booking
  const q = query(
    collection(db, 'bookings'),
    where('amenity', '==', amenity),
    where('date', '==', date),
    where('timeSlot', '==', timeSlot),
    where('status', '==', 'APPROVED')
  );
  
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    throw new Error("This slot is already booked.");
  }

  await addDoc(collection(db, 'bookings'), {
    residentId,
    residentName,
    amenity,
    date,
    timeSlot,
    status: 'PENDING',
    createdAt: serverTimestamp()
  });
};

export const approveResident = async (userId: string, flatId: string, residentName: string) => {
  const batch = writeBatch(db);
  
  // Update user status
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, { status: 'APPROVED' });
  
  // Assign flat to resident
  const flatRef = doc(db, 'flats', flatId);
  batch.update(flatRef, { 
    residentId: userId,
    residentName: residentName
  });
  
  await batch.commit();
};

export const updateComplaintStatus = async (complaintId: string, status: string) => {
  const complaintRef = doc(db, 'complaints', complaintId);
  await updateDoc(complaintRef, { status });
};
