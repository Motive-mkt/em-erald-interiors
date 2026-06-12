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
// Retrieve values from standard Vite environment variables for Vercel deployment
const viteEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
};

// Fall back to local firebase-applet-config.json for seamless AI Studio preview execution
import firebaseAppletConfig from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: viteEnv.apiKey || firebaseAppletConfig.apiKey,
  authDomain: viteEnv.authDomain || firebaseAppletConfig.authDomain,
  projectId: viteEnv.projectId || firebaseAppletConfig.projectId,
  storageBucket: viteEnv.storageBucket || firebaseAppletConfig.storageBucket,
  messagingSenderId: viteEnv.messagingSenderId || firebaseAppletConfig.messagingSenderId,
  appId: viteEnv.appId || firebaseAppletConfig.appId,
  measurementId: viteEnv.measurementId || firebaseAppletConfig.measurementId,
  firestoreDatabaseId: viteEnv.firestoreDatabaseId || firebaseAppletConfig.firestoreDatabaseId,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Custom Database ID support and immediate long polling auto-detect for proxy-served sandboxes
const dbId = (!firebaseConfig.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId === "(default)")
  ? undefined
  : firebaseConfig.firestoreDatabaseId;

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, dbId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Types for app
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'owner' | 'admin' | 'employee' | 'user';
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
  order?: number; // Sorting/ordering sequence index
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
  servicesSubtitle?: string;
  servicesTitleLine1?: string;
  servicesTitleItalic?: string;
  servicesParagraph?: string;
  gallerySubtitle?: string;
  galleryTitleLine1?: string;
  galleryTitleItalic?: string;
  galleryParagraph?: string;
  testimonialsSubtitle?: string;
  testimonialsTitleLine1?: string;
  testimonialsTitleLine2?: string;
  contactSubtitle?: string;
  contactTitleLine1?: string;
  contactTitleItalic?: string;
  contactParagraph?: string;
}

export interface AppearanceDocument {
  logo_url: string;
  logo_text: string;
  splash_images: string[];
}

export const DEFAULT_APPEARANCE: AppearanceDocument = {
  logo_url: "",
  logo_text: "Em-erald",
  splash_images: []
};

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
  splashUrl4: "",
  servicesSubtitle: "Our Services",
  servicesTitleLine1: "Timeless craft,",
  servicesTitleItalic: "tailored for you.",
  servicesParagraph: "Click on any service option to pre-arrange a custom inquiry loop inside our project intake desk below.",
  gallerySubtitle: "Selected Work",
  galleryTitleLine1: "Spaces with a",
  galleryTitleItalic: "soul.",
  galleryParagraph: "A glimpse of recent residential and commercial projects — designed to feel timeless, personal, and entirely yours.",
  testimonialsSubtitle: "Kind Words",
  testimonialsTitleLine1: "Loved by the people",
  testimonialsTitleLine2: "we design for.",
  contactSubtitle: "Ready when you are",
  contactTitleLine1: "Let's design a space that",
  contactTitleItalic: "finally feels like home.",
  contactParagraph: "Whether you're styling a single room or transforming a whole property — we'd love to hear about it."
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

    // 1.5. Appearance config
    const appearanceRef = doc(db, "site_config", "appearance");
    const appearanceSnap = await getDoc(appearanceRef);
    if (!appearanceSnap.exists()) {
      await setDoc(appearanceRef, DEFAULT_APPEARANCE);
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

// Ensures a user document exists in Firestore and returns the UserProfile.
// Fully satisfies the "First User as Owner" check.
export async function ensureAndFetchUserProfile(user: FirebaseUser, signupName?: string): Promise<UserProfile> {
  if (!user.email) {
    throw new Error("User has no email associated with their account.");
  }
  
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  // Determine if this is the bootstrapped or designated master owner email
  const isOwnerEmail = user.email.toLowerCase() === "jessescaledyou@gmail.com";

  if (userSnap.exists()) {
    const profile = userSnap.data() as UserProfile;
    let needsUpdate = false;
    
    if (isOwnerEmail && (profile.role !== "owner" || !profile.approved)) {
      profile.role = "owner";
      profile.approved = true;
      needsUpdate = true;
    } else if (!profile.approved) {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        // Check if there is already an owner
        const hasOwner = usersSnap.docs.some(docRef => {
          const u = docRef.data() as UserProfile;
          return u.role === "owner" && u.approved;
        });
        if (!hasOwner || usersSnap.size <= 1) {
          profile.role = "owner";
          profile.approved = true;
          needsUpdate = true;
        }
      } catch (checkErr) {
        console.warn("Soft check for existing owner failed:", checkErr);
      }
    }
    
    if (needsUpdate) {
      await setDoc(userRef, profile);
    }
    return profile;
  }

  // Double check if any users exist in the collection for the first signup logic
  let isFirstUser = false;
  let hasOwner = false;
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    isFirstUser = usersSnap.empty;
    hasOwner = usersSnap.docs.some(docRef => {
      const u = docRef.data() as UserProfile;
      return u.role === "owner" && u.approved;
    });
  } catch (err) {
    console.warn("Soft check for existing users failed, assuming fallback.", err);
  }

  const assignedAsOwner = isOwnerEmail || isFirstUser || !hasOwner;

  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email.toLowerCase(),
    displayName: signupName || user.displayName || user.email.split("@")[0],
    photoURL: user.photoURL || "",
    role: assignedAsOwner ? "owner" : "employee",
    approved: assignedAsOwner ? true : false,
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

// Sign-In with Google Auth integration with Owner/Employee onboarding rules
export async function signInUserWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  if (!user || !user.email) {
    throw new Error("Unable to read Google user profile details.");
  }
  return await ensureAndFetchUserProfile(user);
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

// Get dynamic appearance configuration
export async function fetchAppearance(): Promise<AppearanceDocument> {
  const ref = doc(db, "site_config", "appearance");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as AppearanceDocument;
  }
  return DEFAULT_APPEARANCE;
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
  try {
    await setDoc(docRef, parsedDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `messages/${msgId}`);
  }
  return msgId;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

