import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp, 
  query, 
  orderBy 
} from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Custom Database ID support
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || "(default)");

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Types for app
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'owner' | 'employee';
  approved: boolean;
}

export interface MessageDocument {
  id?: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  status: 'unread' | 'contacted' | 'archived';
  createdAt: any;
}

export interface ServiceDocument {
  id: string; // Unique path key
  title: string;
  desc: string;
  icon: string; // Icon identifier
  order: number;
}

export interface GalleryDocument {
  id: string; // Unique path key
  url: string; // Image link or asset identifier
  tag: string;
  title: string;
  span: string; // Grid span formatting
}

export interface SiteConfigDocument {
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroTitleItalic: string;
  heroParagraph: string;
  contactPhone: string;
  contactInstagram: string;
  contactOpeningHours: string;
  whatsappNumber: string;
  logoUrl?: string;
  splashUrl1?: string;
  splashUrl2?: string;
  splashUrl3?: string;
  splashUrl4?: string;
}

// Default Configuration and Seeding elements
export const DEFAULT_CONFIG: SiteConfigDocument = {
  heroTitleLine1: "timeless interiors",
  heroTitleLine2: "made personal.",
  heroTitleItalic: "feel like home",
  heroParagraph: "We design intuitive residential & workspace interiors. Intentional flow, considered colour, and honest materials.",
  contactPhone: "0727 827033",
  contactInstagram: "@em_eraldinteriors",
  contactOpeningHours: "Open today • closes 5:30 PM",
  whatsappNumber: "254727827033",
  logoUrl: "",
  splashUrl1: "",
  splashUrl2: "",
  splashUrl3: "",
  splashUrl4: ""
};

export const DEFAULT_SERVICES: ServiceDocument[] = [
  { id: "consulting", title: "consulting for interior spaces", desc: "Expert walkthroughs, colour exploration, and professional styling consultation tailored specifically to your personality.", icon: "Sparkles", order: 1 },
  { id: "space-planning", title: "space planning", desc: "Layouts that move naturally, utilizing every square meter beautifully and functionally.", icon: "Layout", order: 2 },
  { id: "sourcing", title: "sourcing", desc: "Hand-picked materials, furniture, antiques, and design details from our selective supplier network.", icon: "Search", order: 3 },
  { id: "water-proofing", title: "water proofing", desc: "Essential structural protections to keep your interior developments structurally sound and pristine.", icon: "Droplet", order: 4 },
  { id: "concept-development", title: "concept development", desc: "Visual storytelling, interior geometry mapping, and architectural theme definitions built from your style.", icon: "Lightbulb", order: 5 },
  { id: "mood-board", title: "mood board", desc: "Tactile curations of fabrics, palettes, and finishes giving you a solid sense of your project direction.", icon: "Palette", order: 6 },
];

export const DEFAULT_GALLERY: GalleryDocument[] = [];

// Seed site details (restricted to logged-in owner/employees under live rules)
export async function seedInitialData() {
  try {
    // 1. Site config
    const configRef = doc(db, "config", "general");
    const configSnap = await getDoc(configRef);
    if (!configSnap.exists()) {
      await setDoc(configRef, DEFAULT_CONFIG);
    }

    // 2. Services
    const serviceCol = collection(db, "services");
    const servicesSnap = await getDocs(serviceCol);
    if (servicesSnap.empty) {
      for (const s of DEFAULT_SERVICES) {
        await setDoc(doc(db, "services", s.id), s);
      }
    }

    // 3. Gallery
    const galleryCol = collection(db, "gallery");
    const gallerySnap = await getDocs(galleryCol);
    if (gallerySnap.empty) {
      for (const g of DEFAULT_GALLERY) {
        await setDoc(doc(db, "gallery", g.id), g);
      }
    }
    console.log("Seeding complete successfully");
  } catch (err) {
    console.error("Error seeding initial elements:", err);
  }
}

// Sign-In with Google Auth integration with Owner/Employee onboarding rules
export async function signInUserWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  if (!user || !user.email) {
    throw new Error("Unable to read Google user profile details.");
  }

  // Check if profile document already exists
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const profile = userSnap.data() as UserProfile;
    // Auto-promote/upgrade to owner if user is the bootstrapped email OR if they registered but are currently pending and there are no other users
    const isOwnerEmail = user.email.toLowerCase() === "jessescaledyou@gmail.com";
    if (isOwnerEmail && (profile.role !== "owner" || !profile.approved)) {
      profile.role = "owner";
      profile.approved = true;
      await setDoc(userRef, profile);
    } else if (!profile.approved) {
      const usersSnap = await getDocs(collection(db, "users"));
      if (usersSnap.size <= 1) {
        profile.role = "owner";
        profile.approved = true;
        await setDoc(userRef, profile);
      }
    }
    return profile;
  }

  // Check if this is the first user in the collection
  const usersSnap = await getDocs(collection(db, "users"));
  const isFirstUser = usersSnap.empty;

  // Determine role based on email context or first user check
  const isOwnerEmail = user.email.toLowerCase() === "jessescaledyou@gmail.com" || isFirstUser;
  
  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email.toLowerCase(),
    displayName: user.displayName || user.email.split("@")[0],
    photoURL: user.photoURL || "",
    role: isOwnerEmail ? "owner" : "employee",
    approved: isOwnerEmail ? true : false,
  };

  // Write the user document
  await setDoc(userRef, newProfile);
  return newProfile;
}

// Transient tracking for Custom Registration Display Name to coordinate with onAuthStateChanged and avoid concurrent promise collisions
let pendingSignupName = '';

export function setPendingSignupName(name: string) {
  pendingSignupName = name;
}

export function getPendingSignupName() {
  const name = pendingSignupName;
  pendingSignupName = ''; // Read-once
  return name;
}

// Register/Sign-Up with Email and Password
export async function signUpUserWithEmailAndPassword(email: string, password: string, displayName: string): Promise<any> {
  setPendingSignupName(displayName);
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

// Sign-In with Email and Password
export async function signInUserWithEmailAndPassword(email: string, password: string): Promise<any> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// Get standard configuration
export async function fetchSiteConfig(): Promise<SiteConfigDocument> {
  const ref = doc(db, "config", "general");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as SiteConfigDocument;
  }
  return DEFAULT_CONFIG;
}

// List of current services
export async function fetchServices(): Promise<ServiceDocument[]> {
  const colRef = collection(db, "services");
  const snap = await getDocs(colRef);
  if (snap.empty) {
    return DEFAULT_SERVICES;
  }
  const loaded: ServiceDocument[] = [];
  snap.forEach((d) => {
    loaded.push({ id: d.id, ...d.data() } as ServiceDocument);
  });
  return loaded.sort((a, b) => (a.order || 0) - (b.order || 0));
}

// List of gallery elements
export async function fetchGalleryItems(): Promise<GalleryDocument[]> {
  const colRef = collection(db, "gallery");
  const snap = await getDocs(colRef);
  if (snap.empty) {
    return DEFAULT_GALLERY;
  }
  const loaded: GalleryDocument[] = [];
  snap.forEach((d) => {
    loaded.push({ id: d.id, ...d.data() } as GalleryDocument);
  });
  return loaded;
}

// Submit Customer contact inquiry Form with Server Timestamp validation
export async function submitContactMessage(payload: {
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
}): Promise<string> {
  const colRef = collection(db, "messages");
  const parsedDoc = {
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    service: payload.service,
    message: payload.message,
    status: "unread",
    createdAt: serverTimestamp() // ESSENTIAL FOR COMPLIANCE WITH SECURITY RULES TIME EQUALITY
  };

  // Generating a clean document ID
  const msgId = "msg-" + Math.random().toString(36).substring(2, 11);
  const docRef = doc(db, "messages", msgId);
  await setDoc(docRef, parsedDoc);
  return msgId;
}
