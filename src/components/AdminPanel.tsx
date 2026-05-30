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
  Hourglass,
  ChevronLeft,
  UploadCloud,
  Link2
} from 'lucide-react';
import img1 from '../assets/images/serene_bedroom_1779090868311.png';
import img2 from '../assets/images/sage_dining_room_1779090886447.png';
import img3 from '../assets/images/modern_home_office_1779090902647.png';
import img4 from '../assets/images/kitchen_styling_1779090940250.png';
import { 
  auth, 
  db, 
  signInUserWithGoogle, 
  signUpUserWithEmailAndPassword,
  signInUserWithEmailAndPassword,
  getPendingSignupName,
  ensureAndFetchUserProfile,
  UserProfile, 
  MessageDocument, 
  ServiceDocument, 
  GalleryDocument, 
  SiteConfigDocument,
  DEFAULT_CONFIG,
  seedInitialData,
  OperationType,
  handleFirestoreError
} from '../lib/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
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
  const [configSuccess, setConfigSuccess] = useState('');
  const [configError, setConfigError] = useState('');

  // Dynamic Image Upload & Interactive States
  const [uploaderError, setUploaderError] = useState('');
  const [filePreview, setFilePreview] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [logoDragActive, setLogoDragActive] = useState(false);
  const [splash1DragActive, setSplash1DragActive] = useState(false);
  const [splash2DragActive, setSplash2DragActive] = useState(false);
  const [splash3DragActive, setSplash3DragActive] = useState(false);
  const [splash4DragActive, setSplash4DragActive] = useState(false);

  // Bulk Mode Upload states
  const [isBulkMode, setIsBulkMode] = useState(false);
  interface BulkQueueItem {
    id: string;
    name: string;
    size: number;
    base64: string;
    title: string;
    tag: string;
  }
  const [bulkQueue, setBulkQueue] = useState<BulkQueueItem[]>([]);
  const [uploadingBulk, setUploadingBulk] = useState(false);

  // Email and Password Auth States
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Handle Authentication Change listener
  useEffect(() => {
    setLoadingUser(true);
    const unsub = auth.onAuthStateChanged(async (fUser) => {
      if (fUser) {
        try {
          const profile = await ensureAndFetchUserProfile(fUser, getPendingSignupName());
          setCurrentUser(profile);
        } catch (err: any) {
          console.error("Auth sync error:", err);
          setErrorText(err.message || "Error synchronizing database secure session.");
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingUser(false);
    });

    return () => unsub();
  }, []);

  // Role-Based Redirect and Route Protection logic
  useEffect(() => {
    if (loadingUser) return;

    if (currentUser) {
      const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';
      if (isOwnerOrAdmin) {
        // Redirection logic for authenticated owners or admins
        if (location.pathname === '/' || location.pathname === '/profile' || location.pathname === '/login') {
          navigate('/admin', { replace: true });
        }
      } else {
        // Redirection logic for standard core users
        if (location.pathname === '/admin' || location.pathname === '/login') {
          navigate('/profile', { replace: true });
        }
      }
    }
  }, [currentUser, loadingUser, location.pathname, navigate]);

  // Auto-direct to the first dashboard tab after sign-up or sign-in
  useEffect(() => {
    if (currentUser?.uid && currentUser?.approved) {
      setActiveTab('messages');
    }
  }, [currentUser?.uid, currentUser?.approved]);

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
      // Order items based on sequential index sorting
      data.sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : 999;
        const orderB = b.order !== undefined ? b.order : 999;
        return orderA - orderB;
      });
      setGallery(data);
    });

    // 5. Config Listener
    const unsubConfig = onSnapshot(doc(db, 'config', 'general'), (snap) => {
      if (snap.exists()) {
        const cData = snap.data() as SiteConfigDocument;
        setConfig(cData);
        setConfigForm(prev => {
          if (!prev) return cData;
          return prev;
        });
      } else {
        setConfig(DEFAULT_CONFIG);
        setConfigForm(prev => prev || DEFAULT_CONFIG);
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
    setConfigSuccess('');
    setConfigError('');
    try {
      await setDoc(doc(db, 'config', 'general'), configForm);
      if (onUpdateConfig) onUpdateConfig();
      setConfigSuccess("Configuration and dynamic assets saved successfully!");
      // Automatically dismiss the success indicator after 4 seconds
      setTimeout(() => {
        setConfigSuccess('');
      }, 4000);
    } catch (err: any) {
      console.error("Configuration save failed:", err);
      let errMsg = err.message || "Failed to save configuration details.";
      if (err.code === "permission-denied" || errMsg.includes("permission-denied")) {
        errMsg = "Permission denied: Insufficient privileges or image file uploads exceed Firestore limits (max 3MB per logo/splash image).";
      }
      setConfigError(errMsg);
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
    // Auto-calculate order to append to the end of the collection sequence
    const maxOrder = gallery.length > 0 
      ? Math.max(...gallery.map(g => g.order !== undefined ? g.order : 0)) 
      : 0;
      
    try {
      await setDoc(doc(db, 'gallery', gId), { 
        id: gId, 
        ...newGalleryItem,
        order: maxOrder + 1
      });
      setNewGalleryItem({ url: '', tag: 'RESIDENTIAL', title: '', span: 'md:col-span-1 md:row-span-1' });
      setFilePreview('');
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

  // Swapping/Reordering of Gallery Elements in real-time
  const handleMoveGalleryItem = async (tileId: string, direction: 'left' | 'right') => {
    const currentIndex = gallery.findIndex(g => g.id === tileId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= gallery.length) return; // Out of bounds

    const currentItem = gallery[currentIndex];
    const targetItem = gallery[targetIndex];

    const currentOrder = currentItem.order !== undefined ? currentItem.order : currentIndex;
    const targetOrder = targetItem.order !== undefined ? targetItem.order : targetIndex;

    try {
      await updateDoc(doc(db, 'gallery', currentItem.id), { order: targetOrder });
      await updateDoc(doc(db, 'gallery', targetItem.id), { order: currentOrder });
    } catch (err) {
      console.error("Swapping gallery hierarchy failed:", err);
    }
  };

  // Base64 File encoding convertor
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.match('image.*')) {
        return reject(new Error("Image format mismatch. Please upload JPEG, PNG, or WebP."));
      }
      if (file.size > 1.5 * 1024 * 1024) {
        return reject(new Error("File too large. To prevent bandwidth spikes, upload image under 1.5MB."));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) resolve(e.target.result as string);
        else reject(new Error("FileReader outcome is empty."));
      };
      reader.onerror = () => reject(new Error("FileReader generic error."));
      reader.readAsDataURL(file);
    });
  };

  // Unified File upload triggers
  const handleFileUploadChange = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    target: 'gallery' | 'logo' | 'splash1' | 'splash2' | 'splash3' | 'splash4'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploaderError('');
      
      if (target === 'gallery' && isBulkMode) {
        const itemsToAppend: BulkQueueItem[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            const base64 = await convertFileToBase64(file);
            const friendlyName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            itemsToAppend.push({
              id: 'bulk-' + Math.random().toString(36).substring(2, 9),
              name: file.name,
              size: file.size,
              base64,
              title: friendlyName,
              tag: 'GENERAL',
            });
          } catch (itemErr: any) {
            setUploaderError(prev => prev ? prev + ' | ' + itemErr.message : itemErr.message);
          }
        }
        setBulkQueue(prev => [...prev, ...itemsToAppend]);
        e.target.value = ''; // Reset input selection
        return;
      }

      // Single file fallback logic
      const file = files[0];
      const base64 = await convertFileToBase64(file);
      if (target === 'gallery') {
        setFilePreview(base64);
        setNewGalleryItem(prev => ({ ...prev, url: base64 }));
      } else if (target === 'logo') {
        if (configForm) {
          setConfigForm(prev => prev ? ({ ...prev, logoUrl: base64 }) : null);
        }
      } else if (target.startsWith('splash')) {
        const indexStr = target.replace('splash', '');
        if (configForm) {
          const key = `splashUrl${indexStr}` as keyof SiteConfigDocument;
          setConfigForm(prev => prev ? ({ ...prev, [key]: base64 }) : null);
        }
      }
    } catch (err: any) {
      setUploaderError(err.message || 'Error processing selected image file.');
    }
  };

  // Drag overlay triggers
  const handleDrag = (e: React.DragEvent, stateSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      stateSetter(true);
    } else if (e.type === "dragleave") {
      stateSetter(false);
    }
  };

  // Drop event triggers
  const handleDrop = async (
    e: React.DragEvent, 
    target: 'gallery' | 'logo' | 'splash1' | 'splash2' | 'splash3' | 'splash4', 
    stateSetter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    stateSetter(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    try {
      setUploaderError('');
      if (target === 'gallery' && isBulkMode) {
        const itemsToAppend: BulkQueueItem[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            const base64 = await convertFileToBase64(file);
            const friendlyName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            itemsToAppend.push({
              id: 'bulk-' + Math.random().toString(36).substring(2, 9),
              name: file.name,
              size: file.size,
              base64,
              title: friendlyName,
              tag: 'GENERAL',
            });
          } catch (itemErr: any) {
            setUploaderError(prev => prev ? prev + ' | ' + itemErr.message : itemErr.message);
          }
        }
        setBulkQueue(prev => [...prev, ...itemsToAppend]);
        return;
      }

      // Single file drop logic
      const file = files[0];
      const base64 = await convertFileToBase64(file);
      if (target === 'gallery') {
        setFilePreview(base64);
        setNewGalleryItem(prev => ({ ...prev, url: base64 }));
      } else if (target === 'logo') {
        if (configForm) {
          setConfigForm(prev => prev ? ({ ...prev, logoUrl: base64 }) : null);
        }
      } else if (target.startsWith('splash')) {
        const indexStr = target.replace('splash', '');
        if (configForm) {
          const key = `splashUrl${indexStr}` as keyof SiteConfigDocument;
          setConfigForm(prev => prev ? ({ ...prev, [key]: base64 }) : null);
        }
      }
    } catch (err: any) {
      setUploaderError(err.message || 'Error parsing dropped image.');
    }
  };

  // Process the entire concurrent upload batch queue using setDoc
  const handleUploadBulkQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkQueue.length === 0) return;
    
    setUploadingBulk(true);
    setUploaderError('');
    
    const startOrder = gallery.length > 0 
      ? Math.max(...gallery.map(g => g.order !== undefined ? g.order : 0)) 
      : 0;
      
    try {
      const uploadPromises = bulkQueue.map((item, index) => {
        const gId = 'img-' + Math.random().toString(36).substring(2, 9);
        const finalTitle = item.title.trim() || item.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        const finalTag = item.tag.trim() || 'GENERAL';
        
        return setDoc(doc(db, 'gallery', gId), {
          id: gId,
          url: item.base64,
          title: finalTitle,
          tag: finalTag,
          span: 'md:col-span-1 md:row-span-1', // Default Standard square (1x1) preset
          order: startOrder + index + 1
        });
      });

      // Execute concurrent uploads to the storage/database
      await Promise.all(uploadPromises);
      
      setBulkQueue([]);
      if (onUpdateGallery) onUpdateGallery();
    } catch (err: any) {
      console.error("Bulk upload safety processing failed:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, 'gallery');
      } catch (formattedErr: any) {
        setUploaderError(formattedErr.message);
      }
    } finally {
      setUploadingBulk(false);
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
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-emerald/5 flex items-center justify-center text-emerald hover:bg-emerald/10 cursor-pointer z-[60]"
              id="admin-close-btn"
            >
              <X size={18} />
            </button>

            {/* Left Sidebar Menu */}
            <div className="w-full md:w-64 bg-emerald text-cream p-6 md:py-12 flex flex-col justify-between shrink-0 h-auto md:h-full items-stretch relative">
              <div className="md:mt-0 pr-10 md:pr-0">
                <div className="flex items-center gap-3 mb-6 md:mb-10">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <ShieldCheck size={18} className="text-terracotta" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-cream">Emerald Desk</h3>
                    <p className="text-[9px] text-white/50 tracking-wider">SECURE CONSOLE</p>
                  </div>
                </div>

                {currentUser && currentUser.approved && (
                  <nav className="space-y-1 w-full flex flex-row md:flex-col overflow-x-auto gap-2 md:gap-1 select-none no-scrollbar pb-3 md:pb-0">
                    <button 
                      onClick={() => setActiveTab('messages')}
                      className={`w-auto md:w-full text-center md:text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 md:gap-3 transition-colors shrink-0 whitespace-nowrap ${activeTab === 'messages' ? 'bg-cream text-emerald' : 'hover:bg-white/5'}`}
                    >
                      <MessageSquare size={14} /> Messages
                      {messages.filter(m => m.status === 'unread').length > 0 && (
                        <span className="ml-2 md:ml-auto w-4 h-4 rounded-full bg-terracotta text-cream text-[8px] flex items-center justify-center font-bold">
                          {messages.filter(m => m.status === 'unread').length}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={() => setActiveTab('config')}
                      className={`w-auto md:w-full text-center md:text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 md:gap-3 transition-colors shrink-0 whitespace-nowrap ${activeTab === 'config' ? 'bg-cream text-emerald' : 'hover:bg-white/5'}`}
                    >
                      <FileText size={14} /> Configuration
                    </button>
                    <button 
                      onClick={() => setActiveTab('services')}
                      className={`w-auto md:w-full text-center md:text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 md:gap-3 transition-colors shrink-0 whitespace-nowrap ${activeTab === 'services' ? 'bg-cream text-emerald' : 'hover:bg-white/5'}`}
                    >
                      <Layers size={14} /> Services
                    </button>
                    <button 
                      onClick={() => setActiveTab('gallery')}
                      className={`w-auto md:w-full text-center md:text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 md:gap-3 transition-colors shrink-0 whitespace-nowrap ${activeTab === 'gallery' ? 'bg-cream text-emerald' : 'hover:bg-white/5'}`}
                    >
                      <Image size={14} /> Gallery
                    </button>
                    {currentUser.role === 'owner' && (
                      <button 
                        onClick={() => setActiveTab('users')}
                        className={`w-auto md:w-full text-center md:text-left px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 md:gap-3 transition-colors shrink-0 whitespace-nowrap ${activeTab === 'users' ? 'bg-cream text-emerald' : 'hover:bg-white/5'}`}
                      >
                        <Users size={14} /> Team Panel
                        {users.filter(u => !u.approved).length > 0 && (
                          <span className="ml-2 md:ml-auto w-4 h-4 rounded-full bg-terracotta text-cream text-[8px] flex items-center justify-center font-bold">
                            {users.filter(u => !u.approved).length}
                          </span>
                        )}
                      </button>
                    )}
                  </nav>
                )}
              </div>

              {currentUser && (
                <div className="border-t border-white/10 pt-4 mt-2 md:mt-0 flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-medium uppercase text-xs">
                        {(currentUser.displayName || currentUser.email || 'U')[0]}
                      </div>
                    )}
                    <div className="max-w-[120px] overflow-hidden">
                      <p className="text-[11px] font-bold truncate leading-none mb-1">{currentUser.displayName || currentUser.email}</p>
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
            <div className="flex-1 px-6 md:px-12 py-8 md:py-16 overflow-y-auto bg-cream h-0 md:h-full">
              
              {/* LOADING USER PROFILE STATE */}
              {loadingUser && (
                <div className="h-full flex flex-col justify-center items-center text-center max-w-sm mx-auto" id="admin-loading-screen">
                  <div className="w-16 h-16 rounded-full bg-emerald/5 flex items-center justify-center text-emerald mb-8 animate-spin">
                    <Hourglass size={24} />
                  </div>
                  <h3 className="text-xl font-serif text-emerald mb-2">Syncing Console...</h3>
                  <p className="text-emerald/50 text-xs font-semibold">Verifying secure employee credentials, please hold.</p>
                </div>
              )}

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
                        
                        {configSuccess && (
                          <div className="bg-emerald/10 text-emerald text-xs px-4 py-3 rounded-xl font-bold flex items-center gap-2 select-none border border-emerald/20">
                            ✨ {configSuccess}
                          </div>
                        )}

                        {configError && (
                          <div className="bg-red-500/10 text-red-500 text-xs px-4 py-3 rounded-xl font-semibold select-none border border-red-500/20">
                            ⚠️ {configError}
                          </div>
                        )}

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

                          {/* OTHER SITE TEXT DETAILS */}
                          <div className="md:col-span-2 pt-6 border-t border-emerald/5 space-y-4">
                            <h3 className="text-sm font-bold text-emerald tracking-wider uppercase">Section Header Text Customization</h3>
                            <p className="text-[10px] text-emerald/50">Modify the subtitles, headings, and descriptions for each main block of the website page.</p>
                            
                            <div className="space-y-6">
                              {/* SERVICES SECTION TEXTS */}
                              <div className="bg-cream/10 p-5 rounded-2xl border border-emerald/5 space-y-4">
                                <h4 className="text-xs font-bold text-emerald tracking-wide uppercase">Services Section</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Subtitle (e.g. Our Services)</label>
                                    <input 
                                      type="text"
                                      value={configForm.servicesSubtitle || ''}
                                      onChange={(e) => setConfigForm({...configForm, servicesSubtitle: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Heading Line 1</label>
                                    <input 
                                      type="text"
                                      value={configForm.servicesTitleLine1 || ''}
                                      onChange={(e) => setConfigForm({...configForm, servicesTitleLine1: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Heading Italic Focus</label>
                                    <input 
                                      type="text"
                                      value={configForm.servicesTitleItalic || ''}
                                      onChange={(e) => setConfigForm({...configForm, servicesTitleItalic: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Section Description Paragraph</label>
                                    <textarea 
                                      rows={2}
                                      value={configForm.servicesParagraph || ''}
                                      onChange={(e) => setConfigForm({...configForm, servicesParagraph: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-medium resize-none leading-relaxed"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* GALLERY SECTION TEXTS */}
                              <div className="bg-cream/10 p-5 rounded-2xl border border-emerald/5 space-y-4">
                                <h4 className="text-xs font-bold text-emerald tracking-wide uppercase">Gallery Section</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Subtitle (e.g. Selected Work)</label>
                                    <input 
                                      type="text"
                                      value={configForm.gallerySubtitle || ''}
                                      onChange={(e) => setConfigForm({...configForm, gallerySubtitle: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Heading Line 1</label>
                                    <input 
                                      type="text"
                                      value={configForm.galleryTitleLine1 || ''}
                                      onChange={(e) => setConfigForm({...configForm, galleryTitleLine1: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Heading Italic Focus (e.g. soul.)</label>
                                    <input 
                                      type="text"
                                      value={configForm.galleryTitleItalic || ''}
                                      onChange={(e) => setConfigForm({...configForm, galleryTitleItalic: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Section Description Paragraph</label>
                                    <textarea 
                                      rows={2}
                                      value={configForm.galleryParagraph || ''}
                                      onChange={(e) => setConfigForm({...configForm, galleryParagraph: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-medium resize-none leading-relaxed"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* TESTIMONIALS SECTION TEXTS */}
                              <div className="bg-cream/10 p-5 rounded-2xl border border-emerald/5 space-y-4">
                                <h4 className="text-xs font-bold text-emerald tracking-wide uppercase">Testimonials Section</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Subtitle (e.g. Kind Words)</label>
                                    <input 
                                      type="text"
                                      value={configForm.testimonialsSubtitle || ''}
                                      onChange={(e) => setConfigForm({...configForm, testimonialsSubtitle: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Heading Line 1</label>
                                    <input 
                                      type="text"
                                      value={configForm.testimonialsTitleLine1 || ''}
                                      onChange={(e) => setConfigForm({...configForm, testimonialsTitleLine1: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Heading Line 2 (e.g. we design for.)</label>
                                    <input 
                                      type="text"
                                      value={configForm.testimonialsTitleLine2 || ''}
                                      onChange={(e) => setConfigForm({...configForm, testimonialsTitleLine2: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* CONTACT SECTION TEXTS */}
                              <div className="bg-cream/10 p-5 rounded-2xl border border-emerald/5 space-y-4">
                                <h4 className="text-xs font-bold text-emerald tracking-wide uppercase">Contact Section</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Subtitle (e.g. Ready when you are)</label>
                                    <input 
                                      type="text"
                                      value={configForm.contactSubtitle || ''}
                                      onChange={(e) => setConfigForm({...configForm, contactSubtitle: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Heading Line 1</label>
                                    <input 
                                      type="text"
                                      value={configForm.contactTitleLine1 || ''}
                                      onChange={(e) => setConfigForm({...configForm, contactTitleLine1: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Heading Italic Focus (e.g. finally feels like home.)</label>
                                    <input 
                                      type="text"
                                      value={configForm.contactTitleItalic || ''}
                                      onChange={(e) => setConfigForm({...configForm, contactTitleItalic: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-semibold"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-[10px] font-bold text-emerald/60 uppercase block mb-1">Section Description Paragraph</label>
                                    <textarea 
                                      rows={2}
                                      value={configForm.contactParagraph || ''}
                                      onChange={(e) => setConfigForm({...configForm, contactParagraph: e.target.value})}
                                      className="w-full bg-cream rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-terracotta text-xs text-emerald font-medium resize-none leading-relaxed"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Logo Settings Card Component */}
                          <div className="md:col-span-2 bg-cream/30 p-6 rounded-2xl border border-emerald/5 space-y-4">
                            <label className="text-xs font-bold text-emerald tracking-wide uppercase block">Dynamic Logo Customization</label>
                            <p className="text-[10px] text-emerald/50">Upload a crisp PNG or vector SVG with transparency. You can also paste an external secure link below. Sits perfectly over any header background.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                              {/* Logo Drag/Drop Area */}
                              <div 
                                onDragEnter={(e) => handleDrag(e, setLogoDragActive)}
                                onDragOver={(e) => handleDrag(e, setLogoDragActive)}
                                onDragLeave={(e) => handleDrag(e, setLogoDragActive)}
                                onDrop={(e) => handleDrop(e, 'logo', setLogoDragActive)}
                                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${logoDragActive ? 'border-terracotta bg-terracotta/5' : 'border-emerald/10 bg-white hover:border-emerald/30'}`}
                              >
                                {configForm.logoUrl ? (
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="w-full h-16 rounded-xl bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] bg-[size:10px_10px] bg-[position:0_0,0_5px,5px_-5px,-5px_0] bg-white flex items-center justify-center p-2 border border-emerald/5 overflow-hidden">
                                      <img src={configForm.logoUrl} alt="Logo preview" className="h-full object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                    <button 
                                      type="button"
                                      onClick={() => setConfigForm({...configForm, logoUrl: ''})}
                                      className="text-[9px] font-bold text-red-500 uppercase hover:underline cursor-pointer"
                                    >
                                      Remove Logo (Text Fallback)
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2">
                                    <ShieldCheck size={20} className="text-emerald/40" />
                                    <p className="text-[10px] font-bold text-emerald">Drag & drop logo file here</p>
                                    <p className="text-[9px] text-emerald/50">Supports SVG or PNG</p>
                                    <label htmlFor="logo-file-picker" className="bg-emerald text-cream px-3 py-1.5 rounded-lg text-[9px] uppercase font-bold cursor-pointer hover:bg-emerald-soft transition-colors mt-1">
                                      Browse File
                                    </label>
                                    <input 
                                      type="file" 
                                      accept="image/png, image/svg+xml, image/jpeg, image/webp" 
                                      id="logo-file-picker" 
                                      className="hidden" 
                                      onChange={(e) => handleFileUploadChange(e, 'logo')} 
                                    />
                                  </div>
                                )}
                              </div>

                              {/* URL Link Fallback Area */}
                              <div className="space-y-3">
                                <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Custom Logo Image URL</span>
                                <input 
                                  type="text"
                                  value={configForm.logoUrl || ''}
                                  onChange={(e) => setConfigForm({...configForm, logoUrl: e.target.value})}
                                  placeholder="Or paste direct secure logo link..."
                                  className="w-full bg-white rounded-xl px-4 py-3 outline-none border border-emerald/10 text-xs text-emerald font-semibold"
                                />
                                <div className="p-3 bg-white/50 rounded-xl border border-emerald/5">
                                  <p className="text-[9px] text-emerald/50 leading-relaxed font-semibold">
                                    💡 <strong className="text-emerald">Live Updates:</strong> Saving updates your branding immediately. Fallback typographic monogram logo activates if this field is empty.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-2 pt-4 border-t border-emerald/5">
                            <h3 className="text-sm font-bold text-emerald tracking-wider uppercase mb-3">Splash Gate Slideshow</h3>
                            <p className="text-[10px] text-emerald/50 mb-4 font-semibold">Change the four sliding images on display in the welcoming cinematic intro page. Drag & drop or select local files, or insert URLs. Resets back to its beautifully pre-loaded default studio image when cleared.</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {/* Slide 1 */}
                              <div 
                                onDragEnter={(e) => handleDrag(e, setSplash1DragActive)}
                                onDragOver={(e) => handleDrag(e, setSplash1DragActive)}
                                onDragLeave={(e) => handleDrag(e, setSplash1DragActive)}
                                onDrop={(e) => handleDrop(e, 'splash1', setSplash1DragActive)}
                                className={`border p-4 rounded-2xl flex flex-col gap-3 transition-colors ${splash1DragActive ? 'border-terracotta bg-terracotta/5 shadow-inner' : 'bg-cream/30 border-emerald/5'}`}
                              >
                                <span className="text-[10px] font-bold text-emerald uppercase tracking-wider flex justify-between">
                                  <span>Slide 1 — Linen Bedroom</span>
                                  {splash1DragActive && <span className="text-terracotta animate-pulse">Release file...</span>}
                                </span>
                                <div className="relative w-full h-32 bg-emerald/5 rounded-xl overflow-hidden group">
                                  <img 
                                    src={configForm.splashUrl1 || img1} 
                                    alt="Splash 1" 
                                    className="w-full h-full object-cover animate-fade-in" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileUploadChange(e, 'splash1')}
                                    className="hidden" 
                                    id="splash-file-1"
                                  />
                                  <div className="flex gap-2">
                                    <label 
                                      htmlFor="splash-file-1" 
                                      className="flex-1 bg-emerald text-cream py-2 rounded-lg text-[10px] uppercase font-bold text-center cursor-pointer hover:bg-emerald-soft transition-colors"
                                    >
                                      Upload Image
                                    </label>
                                    <button 
                                      type="button" 
                                      onClick={() => setConfigForm({...configForm, splashUrl1: ""})}
                                      className="bg-red-500/15 text-red-500 hover:bg-red-500/25 text-[10px] uppercase font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                  <input 
                                    type="text"
                                    value={configForm.splashUrl1 || ''}
                                    onChange={(e) => setConfigForm({...configForm, splashUrl1: e.target.value})}
                                    placeholder="Or paste secure image link..."
                                    className="w-full bg-white rounded-lg px-2.5 py-1.5 outline-none text-[10px] text-emerald font-semibold border border-emerald/5"
                                  />
                                </div>
                              </div>

                              {/* Slide 2 */}
                              <div 
                                onDragEnter={(e) => handleDrag(e, setSplash2DragActive)}
                                onDragOver={(e) => handleDrag(e, setSplash2DragActive)}
                                onDragLeave={(e) => handleDrag(e, setSplash2DragActive)}
                                onDrop={(e) => handleDrop(e, 'splash2', setSplash2DragActive)}
                                className={`border p-4 rounded-2xl flex flex-col gap-3 transition-colors ${splash2DragActive ? 'border-terracotta bg-terracotta/5 shadow-inner' : 'bg-cream/30 border-emerald/5'}`}
                              >
                                <span className="text-[10px] font-bold text-emerald uppercase tracking-wider flex justify-between">
                                  <span>Slide 2 — Sage Dining Room</span>
                                  {splash2DragActive && <span className="text-terracotta animate-pulse">Release file...</span>}
                                </span>
                                <div className="relative w-full h-32 bg-emerald/5 rounded-xl overflow-hidden group">
                                  <img 
                                    src={configForm.splashUrl2 || img2} 
                                    alt="Splash 2" 
                                    className="w-full h-full object-cover animate-fade-in" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileUploadChange(e, 'splash2')}
                                    className="hidden" 
                                    id="splash-file-2"
                                  />
                                  <div className="flex gap-2">
                                    <label 
                                      htmlFor="splash-file-2" 
                                      className="flex-1 bg-emerald text-cream py-2 rounded-lg text-[10px] uppercase font-bold text-center cursor-pointer hover:bg-emerald-soft transition-colors"
                                    >
                                      Upload Image
                                    </label>
                                    <button 
                                      type="button" 
                                      onClick={() => setConfigForm({...configForm, splashUrl2: ""})}
                                      className="bg-red-500/15 text-red-500 hover:bg-red-500/25 text-[10px] uppercase font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                  <input 
                                    type="text"
                                    value={configForm.splashUrl2 || ''}
                                    onChange={(e) => setConfigForm({...configForm, splashUrl2: e.target.value})}
                                    placeholder="Or paste secure image link..."
                                    className="w-full bg-white rounded-lg px-2.5 py-1.5 outline-none text-[10px] text-emerald font-semibold border border-emerald/5"
                                  />
                                </div>
                              </div>

                              {/* Slide 3 */}
                              <div 
                                onDragEnter={(e) => handleDrag(e, setSplash3DragActive)}
                                onDragOver={(e) => handleDrag(e, setSplash3DragActive)}
                                onDragLeave={(e) => handleDrag(e, setSplash3DragActive)}
                                onDrop={(e) => handleDrop(e, 'splash3', setSplash3DragActive)}
                                className={`border p-4 rounded-2xl flex flex-col gap-3 transition-colors ${splash3DragActive ? 'border-terracotta bg-terracotta/5 shadow-inner' : 'bg-cream/30 border-emerald/5'}`}
                              >
                                <span className="text-[10px] font-bold text-emerald uppercase tracking-wider flex justify-between">
                                  <span>Slide 3 — Modern Home Office</span>
                                  {splash3DragActive && <span className="text-terracotta animate-pulse">Release file...</span>}
                                </span>
                                <div className="relative w-full h-32 bg-emerald/5 rounded-xl overflow-hidden group">
                                  <img 
                                    src={configForm.splashUrl3 || img3} 
                                    alt="Splash 3" 
                                    className="w-full h-full object-cover animate-fade-in" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileUploadChange(e, 'splash3')}
                                    className="hidden" 
                                    id="splash-file-3"
                                  />
                                  <div className="flex gap-2">
                                    <label 
                                      htmlFor="splash-file-3" 
                                      className="flex-1 bg-emerald text-cream py-2 rounded-lg text-[10px] uppercase font-bold text-center cursor-pointer hover:bg-emerald-soft transition-colors"
                                    >
                                      Upload Image
                                    </label>
                                    <button 
                                      type="button" 
                                      onClick={() => setConfigForm({...configForm, splashUrl3: ""})}
                                      className="bg-red-500/15 text-red-500 hover:bg-red-500/25 text-[10px] uppercase font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                  <input 
                                    type="text"
                                    value={configForm.splashUrl3 || ''}
                                    onChange={(e) => setConfigForm({...configForm, splashUrl3: e.target.value})}
                                    placeholder="Or paste secure image link..."
                                    className="w-full bg-white rounded-lg px-2.5 py-1.5 outline-none text-[10px] text-emerald font-semibold border border-emerald/5"
                                  />
                                </div>
                              </div>

                              {/* Slide 4 */}
                              <div 
                                onDragEnter={(e) => handleDrag(e, setSplash4DragActive)}
                                onDragOver={(e) => handleDrag(e, setSplash4DragActive)}
                                onDragLeave={(e) => handleDrag(e, setSplash4DragActive)}
                                onDrop={(e) => handleDrop(e, 'splash4', setSplash4DragActive)}
                                className={`border p-4 rounded-2xl flex flex-col gap-3 transition-colors ${splash4DragActive ? 'border-terracotta bg-terracotta/5 shadow-inner' : 'bg-cream/30 border-emerald/5'}`}
                              >
                                <span className="text-[10px] font-bold text-emerald uppercase tracking-wider flex justify-between">
                                  <span>Slide 4 — Open Kitchen</span>
                                  {splash4DragActive && <span className="text-terracotta animate-pulse">Release file...</span>}
                                </span>
                                <div className="relative w-full h-32 bg-emerald/5 rounded-xl overflow-hidden group">
                                  <img 
                                    src={configForm.splashUrl4 || img4} 
                                    alt="Splash 4" 
                                    className="w-full h-full object-cover animate-fade-in" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileUploadChange(e, 'splash4')}
                                    className="hidden" 
                                    id="splash-file-4"
                                  />
                                  <div className="flex gap-2">
                                    <label 
                                      htmlFor="splash-file-4" 
                                      className="flex-1 bg-emerald text-cream py-2 rounded-lg text-[10px] uppercase font-bold text-center cursor-pointer hover:bg-emerald-soft transition-colors"
                                    >
                                      Upload Image
                                    </label>
                                    <button 
                                      type="button" 
                                      onClick={() => setConfigForm({...configForm, splashUrl4: ""})}
                                      className="bg-red-500/15 text-red-500 hover:bg-red-500/25 text-[10px] uppercase font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                  <input 
                                    type="text"
                                    value={configForm.splashUrl4 || ''}
                                    onChange={(e) => setConfigForm({...configForm, splashUrl4: e.target.value})}
                                    placeholder="Or paste secure image link..."
                                    className="w-full bg-white rounded-lg px-2.5 py-1.5 outline-none text-[10px] text-emerald font-semibold border border-emerald/5"
                                  />
                                </div>
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
                      <div className="bg-white p-8 rounded-3xl border border-emerald/5 shadow-xl space-y-6">
                        <div className="border-b border-emerald/5 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-emerald tracking-widest uppercase">Add Image to Gallery</h3>
                            <p className="text-[10px] text-emerald/50 mt-1">Select or drop image files (JPEG, PNG, WebP) to upload.</p>
                          </div>
                          
                          {/* Premium Bulk Upload Toggle */}
                          <div className="flex items-center gap-3 self-start sm:self-center select-none bg-cream px-3 py-1.5 rounded-2xl border border-emerald/5">
                            <span className="text-[10px] font-bold text-emerald/60 uppercase">Bulk Upload Mode</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsBulkMode(!isBulkMode);
                                setBulkQueue([]);
                                setFilePreview('');
                              }}
                              className={`relative w-10 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${isBulkMode ? 'bg-emerald' : 'bg-emerald/20'}`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-350 ${isBulkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        </div>

                        {uploaderError && (
                          <div className="bg-red-500/10 text-red-500 text-xs px-4 py-3 rounded-xl font-semibold">
                            ⚠️ {uploaderError}
                          </div>
                        )}

                        {!isBulkMode ? (
                          /* SINGLE MODE UPLOAD */
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* File Drag / Drop Box */}
                            <div 
                              onDragEnter={(e) => handleDrag(e, setDragActive)}
                              onDragOver={(e) => handleDrag(e, setDragActive)}
                              onDragLeave={(e) => handleDrag(e, setDragActive)}
                              onDrop={(e) => handleDrop(e, 'gallery', setDragActive)}
                              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center minimum-h-[160px] ${dragActive ? 'border-terracotta bg-terracotta/5' : 'border-emerald/10 hover:border-emerald/35 bg-cream/20'}`}
                            >
                              {filePreview ? (
                                <div className="relative w-full max-w-[200px] aspect-video bg-emerald/5 rounded-xl overflow-hidden group">
                                  <img src={filePreview} alt="Selected file preview" className="w-full h-full object-cover" />
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setFilePreview('');
                                      setNewGalleryItem(prev => ({ ...prev, url: '' }));
                                    }}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-cream uppercase cursor-pointer"
                                  >
                                    Remove Image
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <UploadCloud size={24} className="text-emerald/40 mx-auto" />
                                  <p className="text-[11px] font-bold text-emerald">Drag and drop file here</p>
                                  <p className="text-[9px] text-emerald/50">Supports JPEG, PNG, or WebP (max 1.5MB)</p>
                                  <label htmlFor="gallery-file-picker" className="bg-emerald text-cream px-3 py-1.5 rounded-lg text-[9px] uppercase font-bold cursor-pointer hover:bg-emerald-soft transition-colors mt-2 inline-block">
                                    Browse Image File
                                  </label>
                                  <input 
                                    type="file" 
                                    id="gallery-file-picker" 
                                    accept="image/png, image/jpeg, image/webp" 
                                    className="hidden" 
                                    onChange={(e) => handleFileUploadChange(e, 'gallery')} 
                                  />
                                </div>
                              )}
                            </div>

                            {/* Fallback Paste Link & Metadata Form */}
                            <form onSubmit={handleCreateGalleryItem} className="space-y-4">
                              <div>
                                <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Image URL Address (Optional Fallback)</span>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald/30"><Link2 size={12} /></span>
                                  <input 
                                    type="text"
                                    value={newGalleryItem.url}
                                    onChange={(e) => {
                                      setNewGalleryItem({ ...newGalleryItem, url: e.target.value });
                                      if (e.target.value && !e.target.value.startsWith('data:')) {
                                        setFilePreview(''); // URL takes precedence
                                      }
                                    }}
                                    placeholder="Paste secure direct photo web link..."
                                    className="w-full bg-cream rounded-xl pl-9 pr-4 py-3 outline-none border border-emerald/5 text-xs text-emerald font-semibold"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Project Name</span>
                                  <input 
                                    type="text"
                                    value={newGalleryItem.title}
                                    onChange={(e) => setNewGalleryItem({ ...newGalleryItem, title: e.target.value })}
                                    placeholder="e.g. Linen bedroom"
                                    className="w-full bg-cream rounded-xl px-4 py-3 outline-none border border-emerald/5 text-xs text-emerald font-semibold"
                                    required
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Category Tag</span>
                                  <select 
                                    value={newGalleryItem.tag}
                                    onChange={(e) => setNewGalleryItem({ ...newGalleryItem, tag: e.target.value })}
                                    className="w-full bg-cream rounded-xl px-4 py-3 outline-none border border-emerald/5 text-xs text-emerald font-bold"
                                  >
                                    <option value="RESIDENTIAL">RESIDENTIAL</option>
                                    <option value="WORKSPACE">WORKSPACE</option>
                                    <option value="STYLING">STYLING</option>
                                    <option value="CONCEPT">CONCEPT</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] text-emerald/40 uppercase font-bold block mb-1">Visual Layout Span Grid Configuration</span>
                                <select 
                                  value={newGalleryItem.span}
                                  onChange={(e) => setNewGalleryItem({ ...newGalleryItem, span: e.target.value })}
                                  className="w-full bg-cream rounded-xl px-4 py-3 outline-none border border-emerald/5 text-xs text-emerald font-bold"
                                >
                                  <option value="md:col-span-1 md:row-span-1">Standard square tile (1x1)</option>
                                  <option value="md:col-span-1 md:row-span-2">Portrait tall accent (1x2)</option>
                                  <option value="md:col-span-2 md:row-span-1">Landscape wide panorama (2x1)</option>
                                  <option value="md:col-span-2 md:row-span-2">Epic grand presentation (2x2)</option>
                                </select>
                              </div>

                              <button 
                                type="submit"
                                disabled={!newGalleryItem.url}
                                className="w-full bg-emerald text-cream py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-emerald-soft transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Plus size={14} /> Add Project Image
                              </button>
                            </form>
                          </div>
                        ) : (
                          /* BULK MODE UPLOAD */
                          <div className="space-y-6">
                            {/* Extensive Dropzone */}
                            <div 
                              onDragEnter={(e) => handleDrag(e, setDragActive)}
                              onDragOver={(e) => handleDrag(e, setDragActive)}
                              onDragLeave={(e) => handleDrag(e, setDragActive)}
                              onDrop={(e) => handleDrop(e, 'gallery', setDragActive)}
                              className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all flex flex-col items-center justify-center min-h-[180px] ${dragActive ? 'border-terracotta bg-terracotta/5' : 'border-emerald/10 hover:border-emerald/30 bg-cream/15'}`}
                            >
                              <UploadCloud size={32} className="text-emerald/40 mx-auto" />
                              <h4 className="text-sm font-bold text-emerald mt-2">Drag & drop multiple image files here</h4>
                              <p className="text-[10px] text-emerald/50 mt-1 max-w-md mx-auto">
                                Holds support for multiple high-res JPEGs, PNGs, and WebPs. 
                                Images automatically assign to standard 1x1 configuration grid.
                              </p>
                              
                              <label htmlFor="bulk-file-picker" className="bg-emerald text-cream px-4 py-2 rounded-xl text-[10px] uppercase font-bold cursor-pointer hover:bg-emerald-soft transition-colors mt-4 inline-block shadow-md">
                                Browse Image files
                              </label>
                              <input 
                                type="file" 
                                id="bulk-file-picker" 
                                accept="image/png, image/jpeg, image/webp" 
                                className="hidden" 
                                multiple
                                onChange={(e) => handleFileUploadChange(e, 'gallery')} 
                              />
                            </div>

                            {/* Queued Items List */}
                            {bulkQueue.length > 0 && (
                              <div className="border border-emerald/5 rounded-3xl bg-cream/20 p-6 space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-emerald/5">
                                  <h4 className="text-xs font-bold text-emerald tracking-wide uppercase">Batch Queue • {bulkQueue.length} files selected</h4>
                                  <button 
                                    type="button" 
                                    onClick={() => setBulkQueue([])}
                                    className="text-[9px] font-bold text-red-500 uppercase hover:underline"
                                  >
                                    Reset Queue
                                  </button>
                                </div>

                                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                                  {bulkQueue.map((item, qIdx) => (
                                    <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-emerald/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                                      <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-emerald/5 shrink-0">
                                          <img src={item.base64} alt="Thumb" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0 flex-1 sm:max-w-xs">
                                          <p className="text-[10px] font-mono text-emerald/40 truncate">{item.name}</p>
                                          <p className="text-[9px] text-emerald/30 font-semibold md:block">{(item.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:flex-1">
                                        {/* Editable title input field */}
                                        <div>
                                          <span className="text-[8px] text-emerald/40 uppercase font-bold block mb-0.5">Project Name Placeholder</span>
                                          <input 
                                            type="text"
                                            value={item.title}
                                            onChange={(e) => {
                                              const updated = [...bulkQueue];
                                              updated[qIdx].title = e.target.value;
                                              setBulkQueue(updated);
                                            }}
                                            placeholder="Assign name..."
                                            className="w-full bg-cream rounded-lg px-2.5 py-1.5 outline-none border border-emerald/5 text-[11px] text-emerald font-semibold"
                                          />
                                        </div>

                                        {/* Editable Tag category */}
                                        <div>
                                          <span className="text-[8px] text-emerald/40 uppercase font-bold block mb-0.5">Category Tag</span>
                                          <select 
                                            value={item.tag}
                                            onChange={(e) => {
                                              const updated = [...bulkQueue];
                                              updated[qIdx].tag = e.target.value;
                                              setBulkQueue(updated);
                                            }}
                                            className="w-full bg-cream rounded-lg px-2 py-1 outline-none border border-emerald/5 text-[11px] text-emerald font-bold"
                                          >
                                            <option value="GENERAL">GENERAL</option>
                                            <option value="RESIDENTIAL">RESIDENTIAL</option>
                                            <option value="WORKSPACE">WORKSPACE</option>
                                            <option value="STYLING">STYLING</option>
                                            <option value="CONCEPT">CONCEPT</option>
                                          </select>
                                        </div>
                                      </div>

                                      <button 
                                        type="button"
                                        onClick={() => setBulkQueue(prev => prev.filter(q => q.id !== item.id))}
                                        className="p-2 text-emerald/40 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all cursor-pointer block shrink-0 self-end sm:self-center"
                                        title="Remove file"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <button 
                                  type="button"
                                  onClick={handleUploadBulkQueue}
                                  disabled={uploadingBulk}
                                  className="w-full bg-emerald text-cream py-3.5 rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-emerald-soft transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed select-none"
                                >
                                  {uploadingBulk ? (
                                    <>
                                      <Hourglass size={14} className="animate-spin" /> Uploading Batch ({bulkQueue.length} files)...
                                    </>
                                  ) : (
                                    <>
                                      <Plus size={14} /> Add {bulkQueue.length} Project Images
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* CURRENT GALLERY TILES LIST */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-emerald/5">
                          <h3 className="text-sm font-bold text-emerald tracking-widest uppercase">Current Deployed Gallery Tiles</h3>
                          <span className="text-[10px] bg-emerald/10 text-emerald px-2.5 py-1 rounded-full font-mono font-bold">{gallery.length} Images</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {gallery.map((tile, idx) => (
                            <div key={tile.id} className="bg-white p-4 rounded-3xl border border-emerald/5 relative group flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                              <div className="space-y-3">
                                <div className="w-full h-40 bg-zinc-100 rounded-2xl overflow-hidden mb-3 relative">
                                  {tile.url.startsWith('http') || tile.url.startsWith('data:image/') ? (
                                    <img src={tile.url} alt={tile.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 text-emerald/30 font-mono text-[9px] uppercase font-bold bg-cream/40">
                                      <Building size={16} className="mb-2" /> Local Asset Resource: <br /> "{tile.url}"
                                    </div>
                                  )}
                                  
                                  {/* Delete Hover Action */}
                                  <button 
                                    onClick={() => handleDeleteGalleryItem(tile.id)}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-red-500 hover:bg-red-600 text-cream flex items-center justify-center transition-colors cursor-pointer shadow-md"
                                    title="Delete image"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[8px] bg-terracotta/10 text-terracotta px-2.5 py-1 rounded-md font-bold uppercase tracking-wide">{tile.tag}</span>
                                    <span className="text-[9px] font-mono text-emerald/40 font-bold">Pos {idx + 1}</span>
                                  </div>
                                  <h4 className="text-xs font-bold text-emerald truncate">{tile.title || 'Untitled Space'}</h4>
                                  <p className="text-[9px] text-emerald/40 truncate font-mono mt-0.5">{tile.span.includes('col-span-2 font') ? 'Grid: 2x2' : tile.span.replace('md:', '')}</p>
                                </div>
                              </div>

                              {/* Reordering Command Row */}
                              <div className="flex justify-between items-center pt-3 mt-3 border-t border-emerald/5 gap-2">
                                <button 
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveGalleryItem(tile.id, 'left')}
                                  className="flex-1 bg-cream hover:bg-emerald-soft/10 text-emerald py-1.5 rounded-lg text-[10px] uppercase font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-emerald/5 select-none"
                                >
                                  <ChevronLeft size={12} /> Move Left
                                </button>
                                <button 
                                  type="button"
                                  disabled={idx === gallery.length - 1}
                                  onClick={() => handleMoveGalleryItem(tile.id, 'right')}
                                  className="flex-1 bg-cream hover:bg-emerald-soft/10 text-emerald py-1.5 rounded-lg text-[10px] uppercase font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-emerald/5 select-none"
                                >
                                  Move Right <ChevronRight size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
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
