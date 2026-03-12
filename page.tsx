'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, Users, MessageSquare, AlertTriangle, LogOut, Loader2, CheckCircle2, XCircle, ArrowLeft, BookOpen, Lock, Copy } from 'lucide-react';
import Link from 'next/link';
import { WriterApp, HubApp, CommsApp, SafeguardApp, PlannerApp } from './PortalApps';
import { auth, db } from '../../firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function StaffPortal() {
  const [step, setStep] = useState<'login' | 'waiting_for_message' | 'verifying' | 'success' | 'error' | 'dashboard'>('login');
  const [discordId, setDiscordId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedUser, setVerifiedUser] = useState<{username: string, displayName: string, roles: string[]} | null>(null);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'ASH-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleDiscordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discordId.trim()) return;
    
    setStep('verifying');
    setErrorMessage('');
    
    try {
      // 1. Sign in anonymously to Firebase
      let uid = '';
      try {
        const userCredential = await signInAnonymously(auth);
        uid = userCredential.user.uid;
      } catch (authError: any) {
        console.error("Auth Error:", authError);
        if (authError.code === 'auth/admin-restricted-operation' || authError.code === 'auth/operation-not-allowed') {
          setErrorMessage('Anonymous authentication is disabled in your Firebase project. Please enable it in the Firebase Console under Authentication > Sign-in method.');
        } else {
          setErrorMessage('Failed to connect to authentication service. Please try again.');
        }
        setStep('error');
        return;
      }

      // 2. Generate a random verification code
      const code = generateCode();
      setVerificationCode(code);

      // 3. Create the user document in Firestore
      await setDoc(doc(db, 'users', uid), {
        discordId: discordId.trim(),
        verificationCode: code,
        verified: false,
        roles: [],
        createdAt: serverTimestamp()
      });

      // 4. Move to the waiting step
      setStep('waiting_for_message');

      // 5. Start polling the backend
      pollVerification(discordId.trim(), uid, code);

    } catch (error) {
      console.error(error);
      setErrorMessage('Failed to initialize verification. Please try again.');
      setStep('error');
    }
  };

  const pollVerification = async (dId: string, uid: string, code: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes total (3s * 60)

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        setErrorMessage('Verification timed out. Please try again.');
        setStep('error');
        return;
      }

      try {
        const response = await fetch('/api/verify-discord', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discordId: dId, firebaseUid: uid, code }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          clearInterval(interval);
          
          // Update the user's document in Firestore
          try {
            await setDoc(doc(db, 'users', uid), {
              discordId: dId,
              verified: true,
              roles: data.user.roles,
              displayName: data.user.displayName,
              verificationCode: null,
              createdAt: serverTimestamp()
            }, { merge: true });
          } catch (e) {
            console.error("Failed to update user document:", e);
          }

          setVerifiedUser(data.user);
          setStep('success');
          setTimeout(() => {
            setStep('dashboard');
          }, 1500);
        } else if (response.status === 404 && data.error === 'Verification code not found in channel yet.') {
          // Keep polling
          return;
        } else {
          // A real error occurred (e.g., user not in server, missing role)
          clearInterval(interval);
          setErrorMessage(data.error || 'Verification failed.');
          setStep('error');
        }
      } catch (error) {
        // Network error during polling, just ignore and try again next tick
      }
    }, 3000);
  };

  if (step === 'dashboard') {
    return <Dashboard onLogout={() => { setStep('login'); setVerifiedUser(null); }} discordId={verifiedUser?.displayName || discordId} userRoles={verifiedUser?.roles || []} />;
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors">
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Home</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-stone-200"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md">
            <Shield size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-display font-bold text-center text-stone-900 mb-2">NOVA Safeguarding Portal</h1>
        <p className="text-stone-500 text-center mb-8 text-sm">
          Secure access to NOVA Safeguarding workspace and tools.
        </p>

        {step === 'login' && (
          <form onSubmit={handleDiscordLogin} className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-indigo-800 text-center">
                Authentication requires the <span className="font-bold">Roblox Verified User</span> role in the official Discord server.
              </p>
            </div>
            
            <div>
              <label htmlFor="discordId" className="block text-sm font-medium text-stone-700 mb-1">
                Discord Username or ID
              </label>
              <input
                type="text"
                id="discordId"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                placeholder="e.g. username#1234 or 123456789"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!discordId.trim()}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-3 shadow-sm mt-2"
            >
              <MessageSquare size={20} />
              Verify with Discord
            </button>
          </form>
        )}

        {step === 'waiting_for_message' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-bold text-stone-900 text-lg">Verify your Discord</h2>
              <p className="text-stone-600 text-sm">
                Please type the following code in the <span className="font-bold text-indigo-600">#verification</span> channel on our Discord server.
              </p>
            </div>

            <div className="bg-stone-100 border border-stone-200 rounded-xl p-6 w-full flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Your Code</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-3xl font-bold text-indigo-600 tracking-wider">{verificationCode}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(verificationCode)}
                  className="p-2 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-stone-500 bg-indigo-50 text-indigo-800 px-4 py-3 rounded-lg w-full">
              <Loader2 size={16} className="animate-spin shrink-0" />
              <p>Waiting for your message... This page will update automatically.</p>
            </div>
            
            <button 
              onClick={() => setStep('login')}
              className="text-stone-500 text-sm hover:text-stone-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {step === 'verifying' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 size={40} className="text-indigo-500 animate-spin" />
            <p className="text-stone-600 font-medium">Initializing verification...</p>
          </div>
        )}

        {step === 'success' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 space-y-4"
          >
            <CheckCircle2 size={48} className="text-emerald-500" />
            <p className="text-emerald-700 font-bold text-lg">Verification Successful!</p>
            <p className="text-stone-500 text-sm">Redirecting to dashboard...</p>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 space-y-4"
          >
            <XCircle size={48} className="text-rose-500" />
            <p className="text-rose-700 font-bold text-lg">Verification Failed</p>
            <p className="text-stone-500 text-sm text-center">{errorMessage || 'You do not have the required "Roblox Verified User" role.'}</p>
            <button 
              onClick={() => setStep('login')}
              className="mt-4 text-indigo-600 font-medium hover:underline"
            >
              Try again
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function Dashboard({ onLogout, discordId, userRoles }: { onLogout: () => void, discordId: string, userRoles: string[] }) {
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [appParams, setAppParams] = useState<any>(null);

  const handleOpenApp = (appName: string, params?: any) => {
    setAppParams(params || null);
    setActiveApp(appName);
  };

  const handleBack = () => {
    setActiveApp(null);
    setAppParams(null);
  };

  const ROLE_GOV = "1480245806253736198";
  const ROLE_SLT = "1480246451626836099";
  const ROLE_STAFF = "1479317573152673883";

  const apps = [
    {
      id: "writer",
      name: "Writer",
      description: "Document creation and editing (Word)",
      icon: <FileText size={28} className="text-blue-500" />,
      color: "bg-blue-50 border-blue-100 hover:border-blue-300",
      allowedRoles: [ROLE_GOV, ROLE_SLT, ROLE_STAFF]
    },
    {
      id: "hub",
      name: "Your Drive",
      description: "Shared resources and files (OneDrive)",
      icon: <Users size={28} className="text-teal-500" />,
      color: "bg-teal-50 border-teal-100 hover:border-teal-300",
      allowedRoles: [ROLE_GOV, ROLE_SLT, ROLE_STAFF]
    },
    {
      id: "comms",
      name: "Internal Mail",
      description: "Internal mailbox for NOVA (Outlook-like)",
      icon: <MessageSquare size={28} className="text-indigo-500" />,
      color: "bg-indigo-50 border-indigo-100 hover:border-indigo-300",
      allowedRoles: [ROLE_GOV, ROLE_SLT, ROLE_STAFF]
    },
    {
      id: "safeguard",
      name: "Safeguarding Log",
      description: "Student welfare and incident tracking (CPOMS)",
      icon: <AlertTriangle size={28} className="text-amber-500" />,
      color: "bg-amber-50 border-amber-100 hover:border-amber-300",
      allowedRoles: [ROLE_SLT, ROLE_STAFF]
    },
    {
      id: "planner",
      name: "Curriculum Planner",
      description: "Lesson plans and schedules (Classroom)",
      icon: <BookOpen size={28} className="text-emerald-500" />,
      color: "bg-emerald-50 border-emerald-100 hover:border-emerald-300",
      allowedRoles: [ROLE_SLT, ROLE_STAFF]
    }
  ];

  if (activeApp === 'writer') return <WriterApp onBack={handleBack} userName={discordId} userRoles={userRoles} onOpenApp={handleOpenApp} appParams={appParams} />;
  if (activeApp === 'hub') return <HubApp onBack={handleBack} userName={discordId} userRoles={userRoles} onOpenApp={handleOpenApp} appParams={appParams} />;
  if (activeApp === 'comms') return <CommsApp onBack={handleBack} userName={discordId} userRoles={userRoles} onOpenApp={handleOpenApp} appParams={appParams} />;
  if (activeApp === 'safeguard') return <SafeguardApp onBack={handleBack} userName={discordId} userRoles={userRoles} onOpenApp={handleOpenApp} appParams={appParams} />;
  if (activeApp === 'planner') return <PlannerApp onBack={handleBack} userName={discordId} userRoles={userRoles} onOpenApp={handleOpenApp} appParams={appParams} />;

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Shield size={18} />
            </div>
            <span className="font-display font-bold text-lg text-stone-900">Staff Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-full border border-stone-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-xs font-medium text-stone-600">Verified: {discordId}</span>
            </div>
            <button 
              onClick={onLogout}
              className="text-stone-500 hover:text-rose-600 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-display font-bold text-stone-900 mb-2">Welcome back!</h1>
          <p className="text-stone-600">Access your school applications and resources below.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app, i) => {
            // Check if user has the required role (or if it's still the placeholder, we lock it to demonstrate the feature)
            const hasAccess = app.allowedRoles.some(role => userRoles.includes(role));
            
            return (
              <motion.div
                key={i}
                onClick={() => hasAccess && setActiveApp(app.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl border transition-all shadow-sm ${
                  hasAccess 
                    ? `${app.color} cursor-pointer hover:shadow-md` 
                    : 'bg-stone-50 border-stone-200 opacity-75 cursor-not-allowed'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-14 h-14 rounded-xl shadow-sm flex items-center justify-center ${hasAccess ? 'bg-white' : 'bg-stone-200'}`}>
                    {hasAccess ? app.icon : <Lock size={28} className="text-stone-400" />}
                  </div>
                  {!hasAccess && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-200 px-2 py-1 rounded-md flex items-center gap-1">
                      <Lock size={10} /> Locked
                    </span>
                  )}
                </div>
                <h3 className={`font-display font-bold text-lg mb-1 ${hasAccess ? 'text-stone-900' : 'text-stone-500'}`}>{app.name}</h3>
                <p className={`text-sm ${hasAccess ? 'text-stone-600' : 'text-stone-400'}`}>{app.description}</p>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
