import { collection, addDoc, getDocs, serverTimestamp, doc, setDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const initializeDemoData = async () => {
  // Notices
  const noticesRef = collection(db, 'notices');
  const noticesSnap = await getDocs(noticesRef);
  if (noticesSnap.empty) {
    await addDoc(noticesRef, {
      title: "Annual General Meeting",
      content: "The AGM for TowerTech Society will be held on March 25th at the Clubhouse.",
      date: serverTimestamp(),
      priority: "HIGH"
    });
    await addDoc(noticesRef, {
      title: "Water Tank Cleaning",
      content: "Water supply will be suspended on Sunday from 10 AM to 2 PM for tank cleaning.",
      date: serverTimestamp(),
      priority: "NORMAL"
    });
  }

  // Events
  const eventsRef = collection(db, 'events');
  const eventsSnap = await getDocs(eventsRef);
  if (eventsSnap.empty) {
    await addDoc(eventsRef, {
      title: "Holi Celebration",
      description: "Join us for a vibrant Holi celebration in the society garden!",
      date: serverTimestamp(),
      location: "Main Garden"
    });
    await addDoc(eventsRef, {
      title: "Yoga Workshop",
      description: "Free yoga workshop for all residents every Sunday morning.",
      date: serverTimestamp(),
      location: "Clubhouse"
    });
  }
};

export const seedDemoResident = async () => {
  const q = query(collection(db, 'users'), where('flatNumber', '==', 'A-101'));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    // We can't create the Auth user here easily, but we can at least 
    // prepare the Firestore document. 
    // However, the login will still fail if the Auth user doesn't exist.
    // So we'll handle this in the Login component's "Special Check" section.
  }
};

export const ensureAdminProfile = async (uid: string, email: string) => {
  if (email === "admin@towertech.com" || email === "balajiravindrasurvase@gmail.com") {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid,
        name: "Society Admin",
        email,
        role: "ADMIN",
        status: "APPROVED",
        createdAt: new Date().toISOString()
      });
    }
  }
};
