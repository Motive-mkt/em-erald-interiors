import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  Users, 
  MessageSquare, 
  FileText, 
  Layers, 
  Image, 
  LogOut, 
  Plus, 
  Check, 
  Trash2, 
  Save, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building,
  Hourglass
} from 'lucide-react';
import { 
  auth, 
  db, 
  signInUserWithGoogle, 
  signUpUserWithEmailAndPassword,
  signInUserWithEmailAndPassword,
  getPendingSignupName,
  UserProfile, 
  MessageDocument, 
  ServiceDocument, 
  GalleryDocument, 
  SiteConfigDocument,
  seedInitialData
} from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateConfig?: () => void;
  onUpdateServices?: () => void;
  onUpdateGallery?: () => void;
}

export function AdminPanel({ isOpen, onClose, onUpdateConfig, onUpdateServices, onUpdateGallery }: AdminPanelProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<'messages' | 'config' | 'services' | 'gallery' | 'users'>('messages');

  // Firestore States
  const [messages, setMessages] = useState<MessageDocument[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [services, setServices] = useState<ServiceDocument[]>([]);
  const [gallery, setGallery] = useState<GalleryDocument[]>([]);
  const [config, setConfig] = useState<SiteConfigDocument | null>(null);

  // Form Management states
  const [configForm, setConfigForm] = useState<SiteConfigDocument | null>(null);
  const [newService, setNewService] = useState({ title: '', desc: '', icon: 'Sparkles', order: 1 });
  const [newGalleryItem, setNewGalleryItem] = useState({ url: '', tag: 'RESIDENTIAL', title: '', span: 'md:col-span-1 md:row-span-1' });

  const [savingConfig, setSavingConfig] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Email and Password Auth States
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Handle Authentication Change listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (fUser) => {
      if (fUser) {
        try {
          const uRef = doc(db, 'users', fUser.uid);
          const snap = await getDoc(uRef);
          let userProfile: UserProfile | null = null;
          
          if (snap.exists()) {
            userProfile = snap.data() as UserProfile;
          } else if (fUser.email) {
            // First time login auto boarding
            const isOwnerEmail = fUser.email.toLowerCase() === 'jessescaledyou@gmail.com';
            const signupName = getPendingSignupName();
            const profile: UserProfile = {
              uid: fUser.uid,
              email: fUser.email.toLowerCase(),
              displayName: signupName || fUser.displayName || fUser.email.split('@')[0],
              photoURL: fUser.photoURL || '',
              role: isOwnerEmail ? 'owner' : 'employee',
              approved: isOwnerEmail ? true : false,
            };
            await setDoc(uRef, profile);
            userProfile = profile;
          }

          setCurrentUser(userProfile);
        } catch (err) {
          console.error("Auth sync error:", err);
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingUser(false);
    });

    return () => unsub();
  }, []);

  // Listen to Firestore updates if user is authenticated and approved
  useEffect(() => {
    if (!currentUser || !currentUser.approved) return;

    // 1. Messages Listener
    const qMessages = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubMessages = onSnapshot(qMessages, (snap) => {
      const data: MessageDocument[] = [];
      snap.forEach((d) => {
        data.push({ id: d.id, ...d.data() } as MessageDocument);
      });
      setMessages(data);
    });

    // 2. Users Listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const data: UserProfile[] = [];
      snap.forEach((d) => {
        data.push(d.data() as UserProfile);
      });
      setUsers(data);
    });

    // 3. Services Listener
    const unsubServices = onSnapshot(collection(db, 'services'), (snap) => {
      const data: ServiceDocument[] = [];
      snap.forEach((d) => {
        data.push(d.data() as ServiceDocument);
      });
      setServices(data.sort((a,b) => a.order - b.order));
    });

    // 4. Gallery Listener
    const unsubGallery = onSnapshot(collection(db, 'gallery'), (snap) => {
      const data: GalleryDocument[] = [];
      snap.forEach((d) => {
        data.push(d.data() as GalleryDocument);
      });
      setGallery(data);
    });

    // 5. Config Listener
    const unsubConfig = onSnapshot(doc(db, 'config', 'general'), (snap) => {
      if (snap.exists()) {
        const cData = snap.data() as SiteConfigDocument;
        setConfig(cData);
        setConfigForm(cData);
      }
    });

    return () => {
      unsubMessages();
      unsubUsers();
      unsubServices();
      unsubGallery();
      unsubConfig();
    };
  }, [currentUser]);

  // Handle Google Log-In
  const handleLogin = async () => {
    setErrorText('');
    try {
      await signInUserWithGoogle();
    } catch (err: any) {
      setErrorText(err.message || 'Login failed.');
    }
  };

  // Handle Email and Password Login/Register
  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authSubmitting) return;
    setErrorText('');
    setAuthSubmitting(true);

    try {
      if (authMode === 'signup') {
        if (!emailInput || !passwordInput || !nameInput) {
          throw new Error("Please fill in all signup details.");
        }
        if (passwordInput.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        await signUpUserWithEmailAndPassword(emailInput, passwordInput, nameInput);
      } else {
        if (!emailInput || !passwordInput) {
          throw new Error("Please fill in your email and password.");
        }
        await signInUserWithEmailAndPassword(emailInput, passwordInput);
      }
      // Reset input fields
      setEmailInput('');
      setPasswordInput('');
      setNameInput('');
    } catch (err: any) {
      console.error(err);
      let message = err.message || "Authentication failed. Please check credentials and try again.";
      
      const errorCode = err.code || "";
      const errorMessage = err.message || "";
      
      if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('email-already-in-use')) {
        message = "This email is already associated with an account. Click the 'Sign In' tab above to log in.";
      } else if (errorCode === 'auth/invalid-email' || errorMessage.includes('invalid-email')) {
        message = "The email address is badly formatted. Please enter a valid email address.";
      } else if (errorCode === 'auth/weak-password' || errorMessage.includes('weak-password')) {
        message = "The password is too weak. It must be at least 6 characters long.";
      } else if (
        errorCode === 'auth/wrong-password' || 
        errorCode === 'auth/user-not-found' || 
        errorCode === 'auth/invalid-credential' ||
        errorMessage.includes('wrong-password') ||
        errorMessage.includes('user-not-found') ||
        errorMessage.includes('invalid-credential')
      ) {
        message = "Incorrect email or password. Please verify your details or create an account if you don't have one.";
      } else if (errorCode === 'auth/too-many-requests' || errorMessage.includes('too-many-requests')) {
        message = "To protect this account, login has been temporarily disabled due to too many failed attempts. Please try again later.";
      }
      
      setErrorText(message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Handle Log-Out
  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  // Auto seed helper
  const handleSeed = async () => {
    await seedInitialData();
    if (onUpdateConfig) onUpdateConfig();
    if (onUpdateServices) onUpdateServices();
    if (onUpdateGallery) onUpdateGallery();
  };

  // Manage Messages Status
  const handleUpdateMessageStatus = async (id: string, state: 'unread' | 'contacted' | 'archived') => {
    try {
      await updateDoc(doc(db, 'messages', id), { status: state });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete message record
  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm("Delete this tracked message record permanently?")) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (err) {
      console.error(err);
    }
  };

  // Approve Employee Registration
  const handleApproveUser = async (uid: string, approve: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { approved: approve });
    } catch (err) {
      console.error(err);
    }
  };

  // Revoke/Delete User
  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("Remove this user profile permanently?")) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      console.error(err);
    }
  };

  // Update configuration profile
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configForm) return;
    setSavingConfig(true);
    try {
      await setDoc(doc(db, 'config', 'general'), configForm);
      if (onUpdateConfig) onUpdateConfig();
      alert("Site Text and Contact Details saved successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingConfig(false);
    }
  };

  // Create Service item
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.title) return;
    const sId = newService.title.toLowerCase().replace(/\s+/g, '-');
    try {
      await setDoc(doc(db, 'services', sId), { id: sId, ...newService });
      setNewService({ title: '', desc: '', icon: 'Sparkles', order: services.length + 1 });
      if (onUpdateServices) onUpdateServices();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Service Item
  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Delete this service option permanently?")) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      if (onUpdateServices) onUpdateServices();
    } catch (err) {
      console.error(err);
    }
  };

  // Create Gallery item
  const handleCreateGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryItem.url) return;
    const gId = 'img-' + Math.random().toString(36).substring(2, 9);
    try {
      await setDoc(doc(db, 'gallery', gId), { id: gId, ...newGalleryItem });
      setNewGalleryItem({ url: '', tag: 'RESIDENTIAL', title: '', span: 'md:col-span-1 md:row-span-1' });
      if (onUpdateGallery) onUpdateGallery();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Gallery Item
  const handleDeleteGalleryItem = async (id: string) => {
    if (!window.confirm("Delete this gallery item?")) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
      if (onUpdateGallery) onUpdateGallery();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-emerald/90 backdrop-blur-md z-50 flex justify-end overflow-hidden"
          id="admin-overlay"
        >
          {/* Main Panel Content Box */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className="w-full max-w-5xl bg-cream h-full flex flex-col md:flex-row relative shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            id="admin-card"
          >
            {/* Close Floating Handle */}
            <button 
              onClick={onClose}
              className="absolute top-6 left-6 md:left-auto md:right-6 w-10 h-10 rounded-full bg-emerald/5 flex items-center justify-center text-emerald hover:bg-emerald/10 cursor-pointer z-[60]"
              id="admin-close-btn"
            >
              <X size={18} />
            </button>

            {/* Left Sidebar Menu */}
            <div className="w-full md:w-64 bg-emerald text-cream px-6 py-12 flex flex-col justify-between shrink-0 h-[240px] md:h-full justify-center md:justify-between items-center md:items-stretch">
              <div>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <ShieldCheck size={18} className="text-terracotta" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-cream">Emerald Desk</h3>
                    <p className="text-[9px] text-white/50 tracking-wider">SECURE CONSOLE</p>
                  </div>
                </div>

                {currentUser && currentUser.approved && (
                  <nav className="space-y-1 w-full flex flex-row md:flex-col overflow-x-auto gap-2 md:gap-0 select-none no-scrollbar">
                    <button 
                      onClick={() => setActiveTab('messages')}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-3 transition-colors shrink-0 ${activeTab === 'messages' ? 'bg-cream text-emerald' : 'hover:bg-white/5'}`}
                    >
                      <MessageSquare size={14} /> Messages
                      {messages.filter(m => m.status === 'unread').length > 0 && (
                        <span className="ml-auto w-4 h-4 rounded-full bg-terracotta text-cream text-[8px] flex items-center justify-center font-bold">
                          {messages.filter(m => m.status === 'unread').length}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={() => setActiveTab('config')}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-3 transition-colors shrink-0 ${activeTab === 'config' ? 'bg-cream text-emerald' : 'hover:bg-white/5'}`}
                    >
                      <FileText size={14} /> Configuration
                    </button>
                    <button 
                      onClick={() => setActiveTab('services')}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-3 transition-colors shrink-0 ${activeTab === 'services' ? 'bg-cream text-emerald' : 'hover:bg-white/5'}`}
                    >
                      <Layers size={14} /> Services
                    </button>
                    <button 
                      onClick={() => setActiveTab('gallery')}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-3 transition-colors shrink-0 ${activeTab === 'gallery' ? 'bg-cream text-emerald' : 'hover:bg-white/5'}`}
                    >
                      <Image size={14} /> Gallery
                    </button>
                    {currentUser.role === 'owner' && (
                      <button 
                        onClick={() => setActiveTab('users')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-3 transition-colors shrink-0 ${activeTab === 'users' ? 'bg-cream text-emerald' : 'hover:bg-white/5'}`}
                      >
                        <Users size={14} /> Team Panel
                        {users.filter(u => !u.approved).length > 0 && (
                          <span className="ml-auto w-4 h-4 rounded-full bg-terracotta text-cream text-[8px] flex items-center justify-center font-bold">
                            {users.filter(u => !u.approved).length}
                          </span>
                        )}
                      </button>
                    )}
                  </nav>
                )}
              </div>

              {currentUser && (
                <div className="border-t border-white/10 pt-6 mt-6 md:mt-0 flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-medium uppercase text-xs">
                        {currentUser.displayName[0]}
                      </div>
                    )}
                    <div className="max-w-[120px] overflow-hidden">
                      <p className="text-[11px] font-bold truncate leading-none mb-1">{currentUser.displayName}</p>
                      <p className="text-[8px] text-white/50 tracking-wider font-semibold uppercase">{currentUser.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-cream flex items-center justify-center cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Right Main Working Area */}
            <div className="flex-1 px-8 md:px-12 py-12 md:py-16 overflow-y-auto bg-cream h-[calc(100%-240px)] md:h-full">
              
              {/* SCREEN 1: NOT AUTHENTICATED */}
              {!currentUser && !loadingUser && (
                <div className="py-6 flex flex-col justify-center items-center text-center max-w-sm mx-auto" id="admin-login-screen">
                  <div className="w-16 h-16 rounded-full bg-emerald/5 flex items-center justify-center text-emerald mb-6 shadow-xl shadow-emerald/5 animate-pulse">
                    <Lock size={22} />
                  </div>
                  <h2 className="text-3xl font-serif text-emerald mb-2">Secure Owner Desk</h2>
                  <p className="text-emerald/60 text-xs leading-relaxed mb-8">
                    Access is exclusive to Emma (Emerald Interior's Owner) and verified employees.
                  </p>

                  {/* Auth Panel Toggles */}
                  <div className="flex border-b border-emerald/10 mb-6 w-full select-none">
                    <button 
                      type="button"
                      onClick={() => { setAuthMode('signin'); setErrorText(''); }}
                      className={`flex-1 pb-3 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${authMode === 'signin' ? 'text-emerald border-b-2 border-emerald font-extrabold' : 'text-emerald/40 hover:text-emerald/60'}`}
                    >
                      Sign In
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setAuthMode('signup'); setErrorText(''); }}
                      className={`flex-1 pb-3 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${authMode === 'signup' ? 'text-emerald border-b-2 border-emerald font-extrabold' : 'text-emerald/40 hover:text-emerald/60'}`}
                    >
                      Create Account
                    </button>
                  </div>

                  {/* Custom Email/Password Form */}
                  <form onSubmit={handleEmailPasswordAuth} className="space-y-4 w-full text-left">
                    {authMode === 'signup' && (
                      <div>
                        <label className="text-[10px] font-bold text-emerald/60 tracking-wider uppercase block mb-1.5 select-none">Full Name</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Emma"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="w-full bg-white border border-emerald/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-terracotta text-sm text-emerald font-semibold"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-[10px] font-bold text-emerald/60 tracking-wider uppercase block mb-1.5 select-none">Email address</label>
                      <input 
                        type="email"
                        required
                        placeholder="owner@em-eraldinteriors.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-white border border-emerald/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-terracotta text-sm text-emerald font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-emerald/60 tracking-wider uppercase block mb-1.5 select-none">Password</label>
                      <input 
                        type="password"
                        required
                        placeholder="••••••"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-white border border-emerald/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-terracotta text-sm text-emerald font-semibold"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={authSubmitting}
                      className="w-full bg-emerald text-cream py-3.5 rounded-xl font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2 hover:bg-emerald-soft transition-colors shadow-lg shadow-emerald/10 cursor-pointer mt-6"
                    >
                      {authSubmitting ? "Authenticating..." : authMode === 'signin' ? "Sign In →" : "Register Account →"}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center my-6 w-full select-none">
                    <div className="flex-1 h-px bg-emerald/10" />
                    <span className="text-[9px] font-bold text-emerald/40 uppercase px-3">Or</span>
                    <div className="flex-1 h-px bg-emerald/10" />
                  </div>

                  {/* Google Authenticator Fallback */}
                  <button 
                    onClick={handleLogin}
                    className="border border-emerald/15 hover:bg-emerald/5 text-emerald px-8 py-3.5 rounded-xl font-bold tracking-widest text-xs uppercase transition-all flex items-center gap-3 w-full justify-center cursor-pointer mb-2"
                    id="google-login-btn"
                  >
                    Authenticate with Google
                  </button>

                  {errorText && (
                    <p className="text-red-500 text-[11px] mt-4 font-semibold text-center leading-snug">{errorText}</p>
                  )}
                </div>
              )}

              {/* SCREEN 2: AUTHENTICATED BUT PENDING APPROVAL */}
              {currentUser && !currentUser.approved && (
                <div className="h-full flex flex-col justify-center items-center text-center max-w-md mx-auto" id="pending-approval-screen">
                  <div className="w-16 h-16 rounded-full bg-terracotta/5 flex items-center justify-center text-terracotta mb-8 animate-bounce">
                    <Hourglass size={24} />
                  </div>
                  <h2 className="text-3xl font-serif text-emerald mb-4">Awaiting Verification</h2>
                  <p className="text-emerald/60 text-sm leading-relaxed mb-6">
                    Hello, <span className="font-bold text-emerald">{currentUser.displayName}</span>. Your registration request has been successfully recorded in the database.
                  </p>
                  <div className="bg-emerald/5 rounded-2xl p-6 text-emerald/70 border border-emerald/10 text-xs text-left leading-relaxed mb-8">
                    <p className="font-bold text-emerald mb-2">Notice for employee requests:</p>
                    For your security and complete client privacy, Emma must manually approve your request before you can write changes, manage site configuration, or track contact form inquiries on WhatsApp.
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="border border-emerald/25 text-emerald hover:bg-emerald/5 transition-colors px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase"
                  >
                    Sign In with Another Account
                  </button>
                </div>
              )}

              {/* SCREEN 3: VERIFIED OWNER/EMPLOYEE WORKSPACE */}
              {currentUser && currentUser.approved && (
                <div className="space-y-8 select-none">
                  
                  {/* TAB 1: TRACKED WHATSAPP MESSAGES LOGS */}
                  {activeTab === 'messages' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h2 className="text-3xl font-serif text-emerald">WhatsApp Messages</h2>
                          <p className="text-emerald/50 text-xs font-semibold mt-1">Live tracking database from your contact forms.</p>
                        </div>
                        <div className="text-xs bg-emerald/5 text-emerald px-4 py-2 rounded-full font-bold">
                          {messages.length} inquiries tracked
                        </div>
                      </div>

                      {messages.length === 0 ? (
                        <div className="bg-white/40 border border-emerald/5 rounded-2xl py-16 text-center text-emerald/40 text-sm">
                          No messages submitted yet. Form inquiries will automatically log and list here!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((msg) => (
                            <div 
                              key={msg.id} 
                              className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row justify-between gap-6 ${msg.status === 'unread' ? 'bg-white border-terracotta/30 shadow-md shadow-terracotta/5' : 'bg-white/30 border-emerald/5'}`}
                            >
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h3 className="text-lg font-bold text-emerald">{msg.name}</h3>
                                  <span className={`text-[9px] font-bold tracking-widest px-3 py-1 rounded-full uppercase ${msg.status === 'unread' ? 'bg-terracotta/10 text-terracotta' : msg.status === 'contacted' ? 'bg-emerald/10 text-emerald' : 'bg-gray-200 text-gray-500'}`}>
                                    {msg.status}
                                  </span>
                                  <span className="text-[10px] text-emerald/40 font-mono">
                                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'Just now'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-emerald/70">
                                  <div><span className="font-semibold text-emerald">Phone:</span> {msg.phone}</div>
                                  <div><span className="font-semibold text-emerald">Email:</span> {msg.email}</div>
                                  <div className="md:col-span-2"><span className="font-semibold text-emerald">Requested Service:</span> <span className="bg-emerald/5 px-2.5 py-0.5 rounded-md font-bold">{msg.service}</span></div>
                                </div>

                                <p className="text-xs text-emerald/70 italic bg-cream/70 p-4 rounded-xl leading-relaxed border border-emerald/5 font-medium">
                                  "{msg.message}"
                                </p>
                              </div>

                              <div className="flex md:flex-col justify-end gap-2 text-xs shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-emerald/5">
                                <a 
                                  href={`https://wa.me/${config?.whatsappNumber || '254727827033'}?text=${encodeURIComponent(`Hi ${msg.name}, thank you for reaching out to Em-erald Interiors regarding "${msg.service}"...`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleUpdateMessageStatus(msg.id!, 'contacted')}
                                  className="bg-emerald text-cream px-4 py-2.5 rounded-xl hover:bg-emerald-soft transition-colors font-bold flex items-center justify-center gap-2"
                                >
                                  Reply on WhatsApp <ExternalLink size={12} />
                                </a>

                                {msg.status === 'unread' && (
                                  <button 
                                    onClick={() => handleUpdateMessageStatus(msg.id!, 'contacted')}
                                    className="border border-emerald/20 text-emerald hover:bg-emerald/5 transition-colors px-4 py-2.5 rounded-xl font-bold flex items-center justify-center"
                                  >
                                    Mark as Contacted
                                  </button>
                                )}

                                {msg.status === 'contacted' && (
                                  <button 
                                    onClick={() => handleUpdateMessageStatus(msg.id!, 'archived')}
                                    className="border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors px-4 py-2.5 rounded-xl font-bold flex items-center justify-center"
                                  >
                                    Archive Log
                                  </button>
                                )}

                                {currentUser.role === 'owner' && (
                                  <button 
                                    onClick={() => handleDeleteMessage(msg.id!)}
                                    className="text-red-500 hover:bg-red-500/10 transition-colors py-2.5 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer mt-2 md:mt-auto"
                                  >
                                    <Trash2 size={12} /> Clear Log
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 2: GENERAL TEXT CONFIGURATION */}
                  {activeTab === 'config' && configForm && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="mb-8">
                        <h2 className="text-3xl font-serif text-emerald">Site Configuration</h2>
                        <p className="text-emerald/50 text-xs font-semibold mt-1">Manage core texts, business links, and telephone numbers.</p>
                      </div>

                      <form onSubmit={handleSaveConfig} className="bg-white p-8 rounded-3xl border border-emerald/5 shadow-xl space-y-6">
                        
                        {/* Seeding utility indicator if db not populated */}
                        {!config && (
                          <div className="bg-terracotta/10 border border-terracotta/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                            <p className="text-xs text-terracotta font-medium">Site database has not been seeded with baseline elements.</p>
                            <button 
                              type="button"
                              onClick={handleSeed}
                              className="bg-terracotta text-cream px-4 py-2 rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-terracotta-soft transition-colors"
                            >
                              Seed Initial Elements
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5Col md:col-span-2">
                            <label className="text-xs font-bold text-emerald tracking-wide uppercase">Hero Section Titles</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                              <div>
                                <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Line 1</span>
                                <input 
                                  type="text"
                                  value={configForm.heroTitleLine1}
                                  onChange={(e) => setConfigForm({...configForm, heroTitleLine1: e.target.value})}
                                  className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-sm text-emerald font-semibold"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Italic Focal Expression</span>
                                <input 
                                  type="text"
                                  value={configForm.heroTitleItalic}
                                  onChange={(e) => setConfigForm({...configForm, heroTitleItalic: e.target.value})}
                                  className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-sm text-emerald font-semibold"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Line 2</span>
                                <input 
                                  type="text"
                                  value={configForm.heroTitleLine2}
                                  onChange={(e) => setConfigForm({...configForm, heroTitleLine2: e.target.value})}
                                  className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-sm text-emerald font-semibold"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-emerald tracking-wide uppercase block mb-2">Hero Narrative Paragraph</label>
                            <textarea 
                              rows={3}
                              value={configForm.heroParagraph}
                              onChange={(e) => setConfigForm({...configForm, heroParagraph: e.target.value})}
                              className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-sm text-emerald font-medium resize-none leading-relaxed"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-emerald tracking-wide uppercase block mb-2">Display Contact Phone</label>
                            <input 
                              type="text"
                              value={configForm.contactPhone}
                              onChange={(e) => setConfigForm({...configForm, contactPhone: e.target.value})}
                              className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-sm text-emerald font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-emerald tracking-wide uppercase block mb-2">WhatsApp Direct Number (Format e.g. 254727827033)</label>
                            <input 
                              type="text"
                              value={configForm.whatsappNumber}
                              onChange={(e) => setConfigForm({...configForm, whatsappNumber: e.target.value})}
                              className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-sm text-emerald font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-emerald tracking-wide uppercase block mb-2">Instagram Handler (Display)</label>
                            <input 
                              type="text"
                              value={configForm.contactInstagram}
                              onChange={(e) => setConfigForm({...configForm, contactInstagram: e.target.value})}
                              className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-sm text-emerald font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-emerald tracking-wide uppercase block mb-2">Opening Hours description</label>
                            <input 
                              type="text"
                              value={configForm.contactOpeningHours}
                              onChange={(e) => setConfigForm({...configForm, contactOpeningHours: e.target.value})}
                              className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-sm text-emerald font-semibold"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-emerald tracking-wide uppercase block mb-2">Business Logo Image URL (HTTPS link or empty for primary monogram logo)</label>
                            <input 
                              type="text"
                              value={configForm.logoUrl || ''}
                              onChange={(e) => setConfigForm({...configForm, logoUrl: e.target.value})}
                              placeholder="e.g., https://example.com/logo.png"
                              className="w-full bg-cream rounded-xl px-4 py-3.5 outline-none focus:ring-1 focus:ring-terracotta text-sm text-emerald font-semibold"
                            />
                            <p className="text-[10px] text-emerald/40 mt-1 italic">
                              To customize the business logo, host your image online and paste the URL here. To revert to the primary emerald monogram logo, leave this field empty.
                            </p>
                          </div>

                          <div className="md:col-span-2 pt-4 border-t border-emerald/5">
                            <h3 className="text-sm font-bold text-emerald tracking-wider uppercase mb-3">Splash Gate Slideshow</h3>
                            <p className="text-[10px] text-emerald/50 mb-4 font-semibold">Change the four sliding images on display in the welcoming cinematic intro page. Leave any URL empty to reset to its pre-loaded default studio image.</p>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Splash Carousel Image 1</label>
                                <input 
                                  type="text"
                                  value={configForm.splashUrl1 || ''}
                                  onChange={(e) => setConfigForm({...configForm, splashUrl1: e.target.value})}
                                  placeholder="Paste secure image link (https://...)"
                                  className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Splash Carousel Image 2</label>
                                <input 
                                  type="text"
                                  value={configForm.splashUrl2 || ''}
                                  onChange={(e) => setConfigForm({...configForm, splashUrl2: e.target.value})}
                                  placeholder="Paste secure image link (https://...)"
                                  className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Splash Carousel Image 3</label>
                                <input 
                                  type="text"
                                  value={configForm.splashUrl3 || ''}
                                  onChange={(e) => setConfigForm({...configForm, splashUrl3: e.target.value})}
                                  placeholder="Paste secure image link (https://...)"
                                  className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Splash Carousel Image 4</label>
                                <input 
                                  type="text"
                                  value={configForm.splashUrl4 || ''}
                                  onChange={(e) => setConfigForm({...configForm, splashUrl4: e.target.value})}
                                  placeholder="Paste secure image link (https://...)"
                                  className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-emerald/5 flex justify-end">
                          <button 
                            type="submit"
                            disabled={savingConfig}
                            className="bg-emerald text-cream px-6 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase hover:bg-emerald-soft transition-colors flex items-center gap-2 shadow-lg shadow-emerald/15"
                          >
                            <Save size={14} /> {savingConfig ? 'Saving Elements...' : 'Save Site Details'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* TAB 3: SERVICES MANAGEMENT */}
                  {activeTab === 'services' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                      <div>
                        <h2 className="text-3xl font-serif text-emerald">Space Services</h2>
                        <p className="text-emerald/50 text-xs font-semibold mt-1">Manage available service offerings dynamically.</p>
                      </div>

                      {/* CREATE NEW SERVICE CARD */}
                      <form onSubmit={handleCreateService} className="bg-white p-8 rounded-3xl border border-emerald/5 shadow-xl">
                        <h3 className="text-sm font-bold text-emerald tracking-widest uppercase mb-4">Add Custom Service Option</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div className="md:col-span-2">
                            <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Service Title</span>
                            <input 
                              type="text"
                              value={newService.title}
                              onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                              placeholder="e.g. concept mapping"
                              className="w-full bg-cream rounded-xl px-4 py-3.5 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Display ordering index</span>
                            <input 
                              type="number"
                              value={newService.order}
                              onChange={(e) => setNewService({ ...newService, order: parseInt(e.target.value) || 1 })}
                              className="w-full bg-cream rounded-xl px-4 py-3.5 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                            />
                          </div>
                          <div>
                            <button 
                              type="submit"
                              className="w-full bg-emerald text-cream py-4 rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-emerald-soft transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Plus size={14} /> Add Service
                            </button>
                          </div>
                          <div className="md:col-span-4 mt-2">
                            <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Narrative Description</span>
                            <textarea 
                              rows={2}
                              value={newService.desc}
                              onChange={(e) => setNewService({ ...newService, desc: e.target.value })}
                              placeholder="Describe what is offered in this package service bundle..."
                              className="w-full bg-cream rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-medium resize-none leading-relaxed"
                            />
                          </div>
                        </div>
                      </form>

                      {/* CURRENT SERVICES LIST */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-emerald tracking-widest uppercase">Current Deployed Options</h3>
                        {services.map((item) => (
                          <div key={item.id} className="bg-white/50 p-5 rounded-2xl border border-emerald/5 flex justify-between items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-emerald/10 text-emerald px-2 py-0.5 rounded-md font-mono font-bold">#{item.order}</span>
                                <h4 className="text-md font-bold text-emerald capitalize">{item.title}</h4>
                              </div>
                              <p className="text-xs text-emerald/50 mt-1">{item.desc}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteService(item.id)}
                              className="w-10 h-10 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 4: GALLERY MANAGEMENT */}
                  {activeTab === 'gallery' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                      <div>
                        <h2 className="text-3xl font-serif text-emerald">Dynamic Gallery</h2>
                        <p className="text-emerald/50 text-xs font-semibold mt-1">Control and replace gallery visual layouts.</p>
                      </div>

                      {/* ADD NEW GALLERY IMAGE BUBBLE */}
                      <form onSubmit={handleCreateGalleryItem} className="bg-white p-8 rounded-3xl border border-emerald/5 shadow-xl">
                        <h3 className="text-sm font-bold text-emerald tracking-widest uppercase mb-4">Add Image to Gallery</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div className="md:col-span-2">
                            <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Image URL Links (HTTPS)</span>
                            <input 
                              type="text"
                              value={newGalleryItem.url}
                              onChange={(e) => setNewGalleryItem({ ...newGalleryItem, url: e.target.value })}
                              placeholder="Paste high-res secure photo link..."
                              className="w-full bg-cream rounded-xl px-4 py-3.5 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Image tag category</span>
                            <select 
                              value={newGalleryItem.tag}
                              onChange={(e) => setNewGalleryItem({ ...newGalleryItem, tag: e.target.value })}
                              className="w-full bg-cream rounded-xl px-4 py-3.5 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-bold"
                            >
                              <option value="RESIDENTIAL">RESIDENTIAL</option>
                              <option value="WORKSPACE">WORKSPACE</option>
                              <option value="STYLING">STYLING</option>
                              <option value="CONCEPT">CONCEPT</option>
                            </select>
                          </div>
                          <div>
                            <button 
                              type="submit"
                              className="w-full bg-emerald text-cream py-4 rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-emerald-soft transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Plus size={14} /> Add Image
                            </button>
                          </div>
                          <div className="md:col-span-2 mt-2">
                            <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Project Name</span>
                            <input 
                              type="text"
                              value={newGalleryItem.title}
                              onChange={(e) => setNewGalleryItem({ ...newGalleryItem, title: e.target.value })}
                              placeholder="e.g. Linen bedroom"
                              className="w-full bg-cream rounded-xl px-4 py-3.5 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                            />
                          </div>
                          <div className="md:col-span-2 mt-2">
                            <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Visual grid layout spans</span>
                            <select 
                              value={newGalleryItem.span}
                              onChange={(e) => setNewGalleryItem({ ...newGalleryItem, span: e.target.value })}
                              className="w-full bg-cream rounded-xl px-4 py-3.5 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-bold"
                            >
                              <option value="md:col-span-1 md:row-span-1">Standard square (1x1)</option>
                              <option value="md:col-span-1 md:row-span-2">Portrait tall (1x2)</option>
                              <option value="md:col-span-2 md:row-span-1">Landscape wide (2x1)</option>
                              <option value="md:col-span-2 md:row-span-2">Epic grand (2x2)</option>
                            </select>
                          </div>
                        </div>
                      </form>

                      {/* CURRENT GALLERY TILES LIST */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {gallery.map((tile) => (
                          <div key={tile.id} className="bg-white/50 border border-emerald/5 rounded-2xl overflow-hidden p-3 relative group flex flex-col justify-between">
                            <div className="w-full h-36 bg-emerald/5 rounded-xl overflow-hidden mb-3">
                              {tile.url.startsWith('http') ? (
                                <img src={tile.url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 text-emerald/30 font-mono text-[9px] uppercase font-bold">
                                  <Building size={16} className="mb-2" /> Local Asset Resource: <br /> "{tile.url}"
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] bg-terracotta/10 text-terracotta px-2 py-0.5 rounded font-bold uppercase">{tile.tag}</span>
                                <span className="text-[8px] text-emerald/40 font-semibold">{tile.span.split(' ')[0]}</span>
                              </div>
                              <h4 className="text-xs font-bold text-emerald truncate">{tile.title || 'Untitled Space'}</h4>
                            </div>
                            <button 
                              onClick={() => handleDeleteGalleryItem(tile.id)}
                              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-cream flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md shadow-black/10"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                    </motion.div>
                  )}

                  {/* TAB 5: USERS APPROVALS SECTION (OWNER ONLY) */}
                  {activeTab === 'users' && currentUser.role === 'owner' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                      <div>
                        <h2 className="text-3xl font-serif text-emerald">Team Security Console</h2>
                        <p className="text-emerald/50 text-xs font-semibold mt-1">Approve pending employee registrations manually.</p>
                      </div>

                      {/* PENDING APPROVALS LIST */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-emerald tracking-widest uppercase mb-2 block">Pending Employee Nominations</h3>
                        {users.filter(u => !u.approved).length === 0 ? (
                          <div className="bg-white/40 border border-emerald/5 rounded-2xl py-8 text-center text-emerald/30 text-xs">
                            No pending employee requests.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {users.filter(u => !u.approved).map((pe) => (
                              <div key={pe.uid} className="bg-white p-4 rounded-xl border border-terracotta/30 flex justify-between items-center gap-4 shadow-sm shadow-terracotta/5">
                                <div className="flex items-center gap-3">
                                  {pe.photoURL ? (
                                    <img src={pe.photoURL} alt="" className="w-8 h-8 rounded-full" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-emerald/5 flex justify-center items-center font-bold text-xs">
                                      {pe.displayName[0]}
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-xs font-bold text-emerald">{pe.displayName}</h4>
                                    <p className="text-[10px] text-emerald/40 mt-0.5">{pe.email}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2 text-[10px]">
                                  <button 
                                    onClick={() => handleApproveUser(pe.uid, true)}
                                    className="bg-emerald text-cream px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-soft transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check size={10} /> Verify & Approve
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(pe.uid)}
                                    className="border border-red-500/20 text-red-500 hover:bg-red-500/5 transition-colors px-3 py-1.5 rounded-lg font-bold cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* APPROVED EMPLOYEES AND TEAM */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-emerald tracking-widest uppercase mb-2 block">Approved Team Members</h3>
                        <div className="space-y-2">
                          {users.filter(u => u.approved).map((te) => (
                            <div key={te.uid} className="bg-white/40 p-4 rounded-xl border border-emerald/5 flex justify-between items-center gap-4">
                              <div className="flex items-center gap-3">
                                {te.photoURL ? (
                                  <img src={te.photoURL} alt="" className="w-8 h-8 rounded-full" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-emerald/5 flex justify-center items-center font-bold text-xs">
                                    {te.displayName[0]}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold text-emerald">{te.displayName}</h4>
                                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md uppercase ${te.role === 'owner' ? 'bg-terracotta/10 text-terracotta' : 'bg-emerald/10 text-emerald'}`}>
                                      {te.role}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-emerald/40 mt-0.5">{te.email}</p>
                                </div>
                              </div>
                              {te.role !== 'owner' && (
                                <button 
                                  onClick={() => handleApproveUser(te.uid, false)}
                                  className="text-[10px] text-emerald/40 hover:text-red-500 transition-colors font-bold cursor-pointer"
                                >
                                  Revoke Verification
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </motion.div>
                  )}

                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
