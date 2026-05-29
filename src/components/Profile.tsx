import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, ensureAndFetchUserProfile, UserProfile } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion } from 'motion/react';
import { User, Shield, CheckCircle, Mail, LogOut, ArrowLeft, Loader2, Hourglass } from 'lucide-react';
import { Logo } from './Logo';

export function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (fUser) => {
      if (fUser) {
        try {
          const profile = await ensureAndFetchUserProfile(fUser);
          setUser(profile);
        } catch (err) {
          console.error("Profile load err:", err);
        }
      } else {
        navigate('/admin'); // Redirect back to login if not authenticated
      }
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center" id="profile-loading">
        <Loader2 className="animate-spin text-emerald w-8 h-8" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between py-12 px-4 md:px-8" id="profile-container">
      <div className="max-w-xl w-full mx-auto my-auto">
        <div className="flex justify-center mb-8" id="profile-logo">
          <Logo size="md" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-emerald/10 shadow-2xl shadow-emerald/5 rounded-3xl overflow-hidden p-8 md:p-12"
          id="profile-card"
        >
          <div className="flex flex-col items-center text-center">
            {/* User Avatar */}
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" className="w-24 h-24 rounded-full border-4 border-emerald/5 object-cover mb-6" id="profile-avatar-img" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-emerald/5 border border-emerald/10 flex items-center justify-center mb-6" id="profile-avatar-fallback">
                <User size={40} className="text-emerald/60" />
              </div>
            )}

            <h1 className="text-2xl font-serif text-emerald font-medium tracking-tight mb-2" id="profile-name">
              {user.displayName}
            </h1>
            
            <p className="flex items-center gap-1.5 text-xs text-emerald/60 font-mono mb-6" id="profile-email">
              <Mail size={12} /> {user.email}
            </p>

            {/* Profile Role Details */}
            <div className="w-full bg-emerald/5 border border-emerald/10 rounded-2xl p-6 mb-8 text-left" id="profile-info-grid">
              <div className="grid grid-cols-2 gap-y-4 text-xs font-semibold">
                <div className="text-emerald/50">Account Role</div>
                <div className="text-emerald text-right uppercase tracking-wider font-mono font-bold" id="profile-role-val">
                  {user.role}
                </div>

                <div className="text-emerald/50">Access Status</div>
                <div className="text-right" id="profile-status-val">
                  {user.approved ? (
                    <span className="inline-flex items-center gap-1 text-emerald font-bold">
                      <CheckCircle size={14} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-terracotta font-bold">
                      <Hourglass size={14} className="animate-pulse" /> Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-4 w-full" id="profile-actions">
              <button
                onClick={() => navigate('/')}
                className="flex-1 flex items-center justify-center gap-2 border border-emerald/20 text-emerald hover:bg-emerald/5 transition-colors px-4 py-3 rounded-2xl font-bold text-xs tracking-wider uppercase cursor-pointer"
                id="profile-btn-home"
              >
                <ArrowLeft size={14} /> Home
              </button>

              {(user.role === 'owner' || user.role === 'admin') && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald text-cream hover:bg-emerald-soft transition-colors px-4 py-3 rounded-2xl font-bold text-xs tracking-wider uppercase cursor-pointer"
                  id="profile-btn-admin"
                >
                  <Shield size={14} /> Admin
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 bg-terracotta text-white hover:bg-opacity-90 transition-opacity px-4 py-3 rounded-2xl font-bold text-xs tracking-wider uppercase cursor-pointer"
                id="profile-btn-logout"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
