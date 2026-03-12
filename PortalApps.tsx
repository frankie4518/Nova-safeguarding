'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, FileText, Folder, Upload, Search, Hash, Send, Plus, Calendar as CalendarIcon, Clock, User, AlertTriangle, CheckCircle2, Users, MessageSquare, BookOpen, Loader2, Shield, UserPlus, Lock } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatFirebaseError } from '../../lib/utils';

interface AppProps {
  onBack: () => void;
  userName: string;
  userRoles: string[];
  onOpenApp?: (appName: string, params?: any) => void;
  appParams?: any;
}

// --- 1. Writer (Word Processor Mock) ---
export function WriterApp({ onBack, userName, userRoles }: AppProps) {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [documents, setDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState<boolean>(true);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const [sensitivity, setSensitivity] = useState('General');
  const [docId, setDocId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareInput, setShareInput] = useState('');
  const [shareAccess, setShareAccess] = useState<'edit' | 'view'>('view');

  const ROLE_SUPER_ADMIN = "1480245806253736198";
  const isSuperAdmin = userRoles.includes(ROLE_SUPER_ADMIN);

  useEffect(() => {
    if (view === 'list') {
      setDocsLoading(true);
      setDocsError(null);
      const q = query(collection(db, 'documents'), orderBy('updatedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        const myDocs = allDocs.filter(doc => 
          isSuperAdmin || 
          doc.authorId === auth.currentUser?.uid || 
          (doc.sharedWith && doc.sharedWith.includes(auth.currentUser?.uid)) ||
          (doc.sharedWith && doc.sharedWith.includes('all_staff')) ||
          (doc.sharedWithEdit && doc.sharedWithEdit.includes(auth.currentUser?.uid)) ||
          (doc.sharedWithView && doc.sharedWithView.includes(auth.currentUser?.uid))
        );
        setDocuments(myDocs);
        setDocsLoading(false);
      }, (err) => {
        console.error('Documents snapshot error:', err);
        setDocsError(formatFirebaseError(err));
        setDocsLoading(false);
      });

      return () => unsubscribe();
    }
  }, [view]);

  const handleCreateDoc = () => {
    setTitle('Untitled Document');
    setSensitivity('General');
    setShowNewModal(true);
  };

  const handleConfirmCreate = async () => {
    if (!auth.currentUser) return;
    try {
      const newDoc = await addDoc(collection(db, 'documents'), {
        title: title.trim() || 'Untitled Document',
        content: '',
        sensitivity,
        authorId: auth.currentUser.uid,
        authorName: userName,
        sharedWith: [],
        sharedWithEdit: [],
        sharedWithView: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setDocId(newDoc.id);
      setContent('');
      setShowNewModal(false);
      setView('editor');
    } catch (error) {

            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-grow p-8 max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-light text-stone-800 mb-6">New</h2>
            <div className="flex gap-4">
              <button 
                onClick={handleCreateDoc}
                className="w-48 h-64 bg-white border border-stone-200 hover:border-[#2B579A] hover:shadow-md transition-all rounded-sm flex flex-col items-center justify-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-full bg-stone-100 group-hover:bg-blue-50 flex items-center justify-center text-[#2B579A]">
                  <Plus size={24} />
                </div>
                <span className="text-stone-700 font-medium">Blank document</span>
              </button>
            </div>
          </div>

          <div>
            {operationError && (
              <div className="mb-4">
                <ErrorMessage message={operationError} />
              </div>
            )}
            <h2 className="text-xl font-light text-stone-800 mb-4">Recent</h2>
            <div className="bg-white border border-stone-200 rounded-sm shadow-sm">
              {docsLoading ? (
                <div className="p-6">
                  <LoadingSpinner />
                </div>
              ) : docsError ? (
                <div className="p-4">
                  <ErrorMessage message={docsError} />
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200 text-stone-500 bg-stone-50">
                    <tr>
                      <th className="px-6 py-3 font-medium w-1/2">Name</th>
                      <th className="px-6 py-3 font-medium">Modified</th>
                      <th className="px-6 py-3 font-medium">Author</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {documents.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-stone-500">No recent documents.</td>
                      </tr>
                    ) : documents.map((doc, i) => (
                      <tr key={doc.id || i} onClick={() => handleOpenDoc(doc)} className="hover:bg-stone-50 cursor-pointer transition-colors group">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <FileText size={20} className="text-[#2B579A]" />
                          <span className="font-medium text-stone-800 group-hover:text-[#2B579A]">{doc.title || 'Untitled Document'}</span>
                        </td>
                        <td className="px-6 py-4 text-stone-500">
                          {doc.updatedAt?.toDate ? doc.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                        </td>
                        <td className="px-6 py-4 text-stone-500">{doc.authorName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2F1] flex flex-col font-sans">
      <header className="bg-[#2B579A] text-white h-12 flex items-center px-4 justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="p-1.5 hover:bg-white/10 rounded transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center text-[#2B579A]">
              <FileText size={16} />
            </div>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              className="font-medium text-sm bg-transparent border-none focus:ring-0 p-1 hover:bg-white/10 rounded outline-none w-64 text-white placeholder-white/70 disabled:opacity-80"
              placeholder="Document Title"
            />
            <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-medium border border-white/30 ${
              sensitivity === 'Public' ? 'bg-green-500/20 text-green-100' :
              sensitivity === 'Confidential' ? 'bg-orange-500/20 text-orange-100' :
              sensitivity === 'Strictly Confidential' ? 'bg-red-500/20 text-red-100' :
              'bg-blue-500/20 text-blue-100'
            }`}>
              {sensitivity}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {canEdit && (
            <button onClick={() => setShowShareModal(true)} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm font-medium flex items-center gap-2 transition-colors">
              <Users size={14} /> Share
            </button>
          )}
          {(isSuperAdmin || currentDoc?.authorId === auth.currentUser?.uid) && (
            <button onClick={handleDeleteDoc} className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 border border-rose-500/30 rounded text-sm font-medium transition-colors">
              Delete
            </button>
          )}
          {saving ? (
            <span className="text-xs text-white/80 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Saving...</span>
          ) : (
            <span className="text-xs text-white/80 flex items-center gap-1"><CheckCircle2 size={12} /> Saved</span>
          )}
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="bg-[#F3F2F1] border-b border-stone-200 p-2 flex items-center justify-center gap-1 shrink-0">
        <div className="flex items-center bg-white border border-stone-200 rounded-sm p-0.5 shadow-sm">
          <button className="p-1.5 hover:bg-stone-100 rounded-sm text-stone-700 transition-colors"><Bold size={16} /></button>
          <button className="p-1.5 hover:bg-stone-100 rounded-sm text-stone-700 transition-colors"><Italic size={16} /></button>
          <button className="p-1.5 hover:bg-stone-100 rounded-sm text-stone-700 transition-colors"><Underline size={16} /></button>
        </div>
        <div className="w-px h-6 bg-stone-300 mx-2"></div>
        <div className="flex items-center bg-white border border-stone-200 rounded-sm p-0.5 shadow-sm">
          <button className="p-1.5 bg-stone-100 rounded-sm text-stone-900 transition-colors"><AlignLeft size={16} /></button>
          <button className="p-1.5 hover:bg-stone-100 rounded-sm text-stone-700 transition-colors"><AlignCenter size={16} /></button>
          <button className="p-1.5 hover:bg-stone-100 rounded-sm text-stone-700 transition-colors"><AlignRight size={16} /></button>
        </div>
      </div>

      <main className="flex-grow p-8 flex justify-center overflow-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-md border border-stone-200 w-full max-w-[816px] min-h-[1056px] p-16 rounded-sm"
        >
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!canEdit}
            className="w-full h-full resize-none outline-none text-stone-800 leading-relaxed font-serif text-base disabled:bg-transparent"
            placeholder={canEdit ? "Start typing..." : "This document is empty."}
          />
        </motion.div>
      </main>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-stone-900 mb-4">Share Document</h3>
            <div className="space-y-4">
              <button onClick={() => handleShare('all_staff', 'view')} className="w-full flex items-center justify-center gap-2 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-medium transition-colors">
                <Users size={18} /> Share with All Staff
              </button>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink-0 mx-4 text-stone-400 text-sm">or share external</span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">User ID / Email</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={shareInput}
                    onChange={(e) => setShareInput(e.target.value)}
                    className="flex-grow border border-stone-300 rounded-md p-2 focus:ring-2 focus:ring-[#2B579A] outline-none"
                    placeholder="Enter user ID or email"
                  />
                  <select
                    value={shareAccess}
                    onChange={(e) => setShareAccess(e.target.value as 'edit' | 'view')}
                    className="border border-stone-300 rounded-md p-2 focus:ring-2 focus:ring-[#2B579A] outline-none bg-white"
                  >
                    <option value="view">Can view</option>
                    <option value="edit">Can edit</option>
                  </select>
                </div>
                <button onClick={() => handleShare(shareInput, shareAccess)} disabled={!shareInput.trim()} className="w-full py-2 bg-[#2B579A] text-white rounded-md hover:bg-[#1f4072] disabled:opacity-50">Share External</button>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowShareModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-md">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 2. Your Drive (OneDrive Mock) ---
export function HubApp({ onBack, userName, userRoles, onOpenApp }: AppProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [foldersLoading, setFoldersLoading] = useState<boolean>(true);
  const [foldersError, setFoldersError] = useState<string | null>(null);
  const [filesLoading, setFilesLoading] = useState<boolean>(true);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string>('My files');
  const [view, setView] = useState<'my_files' | 'shared'>('my_files');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFile, setEditingFile] = useState<any>(null);
  const [editName, setEditName] = useState('');

  const ROLE_SUPER_ADMIN = "1480245806253736198";
  const isSuperAdmin = userRoles.includes(ROLE_SUPER_ADMIN);

  useEffect(() => {
    setFoldersLoading(true);
    setFoldersError(null);
    const qFolders = query(collection(db, 'hub_folders'), orderBy('createdAt', 'desc'));
    const unsubscribeFolders = onSnapshot(qFolders, (snapshot) => {
      const allFolders = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setFolders(allFolders);
      setFoldersLoading(false);
    }, (err) => {
      console.error('hub_folders snapshot error:', err);
      setFoldersError(formatFirebaseError(err));
      setFoldersLoading(false);
    });

    return () => unsubscribeFolders();
  }, []);

  useEffect(() => {
    // Fetch both hub_files and documents to show in the Hub
    const q1 = query(collection(db, 'hub_files'), orderBy('createdAt', 'desc'));
    const q2 = query(collection(db, 'documents'), orderBy('updatedAt', 'desc'));
    
    setFilesLoading(true);
    setFilesError(null);
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const hubFiles = snapshot.docs.map(doc => ({ id: doc.id, type: 'file', ...(doc.data() as any) }));
      setFiles(prev => {
        const otherFiles = prev.filter(f => f.type === 'document');
        return [...hubFiles, ...otherFiles].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      });
      setFilesLoading(false);
    }, (err) => {
      console.error('hub_files snapshot error:', err);
      setFilesError(formatFirebaseError(err));
      setFilesLoading(false);
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        type: 'document', 
        name: doc.data().title || 'Untitled Document', 
        size: Math.floor((doc.data().content?.length || 0) / 1024) + ' KB',
        ...(doc.data() as any)
      }));
      setFiles(prev => {
        const otherFiles = prev.filter(f => f.type === 'file');
        return [...otherFiles, ...docs].sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
      });
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  const handleCreateFolder = async () => {
    if (!auth.currentUser || !newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'hub_folders'), {
        name: newFolderName.trim(),
        authorId: auth.currentUser.uid,
        authorName: userName,
        createdAt: serverTimestamp()
      });
      setNewFolderName('');
      setShowNewFolderModal(false);
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const handleRenameFile = async (file: any) => {
    if (!editName.trim() || !auth.currentUser) return;
    try {
      if (file.type === 'document') {
        await updateDoc(doc(db, 'documents', file.id), {
          title: editName.trim(),
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, 'hub_files', file.id), {
          name: editName.trim(),
          updatedAt: serverTimestamp()
        });
      }
      setEditingFile(null);
      setEditName('');
    } catch (error) {
      console.error("Error renaming file:", error);
    }
  };

  const handleUpload = async () => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'hub_files'), {
        name: `Uploaded File ${Date.now() % 100}.pdf`,
        type: 'file',
        size: ((Date.now() % 50) / 10).toFixed(1) + ' MB',
        authorId: auth.currentUser.uid,
        authorName: userName,
        folderId: currentFolderId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const displayedFolders = view === 'my_files' && !currentFolderId ? folders : [];
  const displayedFiles = files.filter(f => {
    if (view === 'shared') {
      return f.sharedWith?.includes(auth.currentUser?.uid) || 
             f.sharedWith?.includes('all_staff') ||
             f.sharedWithEdit?.includes(auth.currentUser?.uid) ||
             f.sharedWithView?.includes(auth.currentUser?.uid);
    }
    
    if (currentFolderId) {
      return f.folderId === currentFolderId;
    }
    
    // In root 'My files', show files with no folderId
    return !f.folderId && (isSuperAdmin || f.authorId === auth.currentUser?.uid);
  });

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="bg-[#0078D4] text-white h-12 flex items-center px-4 justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center text-[#0078D4]">
              <Users size={16} />
            </div>
            <span className="font-semibold text-sm">Your Drive</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <input type="text" placeholder="Search" className="pl-9 pr-4 py-1.5 bg-white/20 border-transparent rounded text-sm text-white placeholder-white/70 focus:bg-white focus:text-stone-900 focus:placeholder-stone-500 outline-none transition-all w-96" />
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-[#F3F2F1] border-r border-stone-200 p-4 flex flex-col gap-1 shrink-0">
          <button 
            onClick={() => { setView('my_files'); setCurrentFolderId(null); setCurrentFolderName('My files'); }}
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${view === 'my_files' && !currentFolderId ? 'bg-white text-[#0078D4] shadow-sm border border-stone-200' : 'text-stone-700 hover:bg-stone-200'}`}
          >
            <Folder size={18} />
            My files
          </button>
          <button 
            onClick={() => { setView('shared'); setCurrentFolderId(null); setCurrentFolderName('Shared with me'); }}
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${view === 'shared' ? 'bg-white text-[#0078D4] shadow-sm border border-stone-200' : 'text-stone-700 hover:bg-stone-200'}`}
          >
            <Users size={18} />
            Shared
          </button>
        </aside>

        <main className="flex-1 p-8 overflow-auto bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                {currentFolderId && (
                  <button onClick={() => { setCurrentFolderId(null); setCurrentFolderName('My files'); }} className="p-1 hover:bg-stone-100 rounded-full text-stone-500 transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h1 className="text-2xl font-semibold text-stone-800">{currentFolderName}</h1>
              </div>
              <div className="flex items-center gap-3">
                {view === 'my_files' && (
                  <>
                    <button 
                      onClick={handleUpload}
                      className="bg-[#0078D4] hover:bg-[#005A9E] text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Upload size={16} />
                      Upload
                    </button>
                    <button 
                      onClick={() => setShowNewFolderModal(true)}
                      className="bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Plus size={16} />
                      New Folder
                    </button>
                  </>
                )}
              </div>
            </div>

            {displayedFolders.length > 0 && (
              <div className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {displayedFolders.map((folder, i) => {
                    const folderItems = files.filter(f => f.folderId === folder.id).length;
                    return (
                      <div 
                        key={folder.id || i} 
                        onClick={() => { setCurrentFolderId(folder.id); setCurrentFolderName(folder.name); }}
                        className="bg-white border border-stone-200 p-4 rounded-md hover:shadow-md transition-all cursor-pointer group flex items-center gap-4"
                      >
                        <Folder size={32} className="text-blue-500 group-hover:scale-110 transition-transform" />
                        <div>
                          <h3 className="font-medium text-stone-800 text-sm">{folder.name}</h3>
                          <p className="text-xs text-stone-500">{folderItems} items</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-200 text-stone-500">
                  <tr>
                    <th className="px-4 py-3 font-medium w-1/2">Name</th>
                    <th className="px-4 py-3 font-medium">Modified</th>
                    <th className="px-4 py-3 font-medium">Modified By</th>
                    <th className="px-4 py-3 font-medium">File size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {displayedFiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-stone-500">This folder is empty.</td>
                    </tr>
                  ) : displayedFiles.map((file, i) => (
                    <tr key={file.id || i} className="hover:bg-stone-50 transition-colors group">
                      <td className="px-4 py-3 flex items-center gap-3">
                        {file.type === 'document' ? (
                          <FileText size={20} className="text-[#2B579A]" />
                        ) : (
                          <FileText size={20} className="text-rose-500" />
                        )}
                        
                        {editingFile?.id === file.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="border border-[#0078D4] rounded px-2 py-1 outline-none text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameFile(file);
                                if (e.key === 'Escape') setEditingFile(null);
                              }}
                            />
                            <button onClick={() => handleRenameFile(file)} className="text-xs bg-[#0078D4] text-white px-2 py-1 rounded">Save</button>
                            <button onClick={() => setEditingFile(null)} className="text-xs text-stone-500 hover:text-stone-700">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group-hover:text-[#0078D4]">
                            <span 
                              className="font-medium text-stone-800 cursor-pointer"
                              onClick={() => {
                                if (file.type === 'document' && onOpenApp) {
                                  onOpenApp('writer', { docId: file.id });
                                }
                              }}
                            >
                              {file.name}
                            </span>
                            {(isSuperAdmin || file.authorId === auth.currentUser?.uid) && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setEditingFile(file); setEditName(file.name); }}
                                className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-[#0078D4] text-xs transition-opacity"
                              >
                                Rename
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-500">
                        {file.updatedAt?.toDate ? file.updatedAt.toDate().toLocaleDateString() : 
                         file.createdAt?.toDate ? file.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </td>
                      <td className="px-4 py-3 text-stone-500">{file.authorName}</td>
                      <td className="px-4 py-3 text-stone-500">{file.size || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-stone-900 mb-4">Create New Folder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Folder Name</label>
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full border border-stone-300 rounded-md p-2 focus:ring-2 focus:ring-[#0078D4] outline-none"
                  placeholder="Enter folder name..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                  }}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowNewFolderModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-md transition-colors">Cancel</button>
              <button onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="px-4 py-2 bg-[#0078D4] text-white rounded-md hover:bg-[#005A9E] transition-colors disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 3. Internal Mail (Mailbox Mock) ---
export function CommsApp({ onBack, userName, userRoles }: AppProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [channel, setChannel] = useState('general');

  const ROLE_SLT = "1480246451626836099";
  const isSLT = userRoles.includes(ROLE_SLT);

  const channels = [
    { id: 'general', name: 'General', icon: <Hash size={18} /> },
    { id: 'announcements', name: 'Announcements', icon: <Hash size={18} /> },
    { id: 'staff-room', name: 'Staff Room', icon: <Hash size={18} /> },
    ...(isSLT ? [{ id: 'leadership', name: 'Leadership Team', icon: <Lock size={18} /> }] : [])
  ];

  useEffect(() => {
    const q = query(collection(db, 'internal_mail'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    }, (err) => {
      console.error('internal_mail snapshot error:', err);
    });
    return () => unsubscribe();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !auth.currentUser) return;
    
    const msgText = message;
    setMessage('');
    
    try {
      await addDoc(collection(db, 'internal_mail'), {
        channel: channel,
        text: msgText,
        authorId: auth.currentUser.uid,
        authorName: userName,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans">
      <header className="bg-[#464EB8] text-white h-12 flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center text-[#464EB8]">
              <Users size={16} />
            </div>
            <span className="font-semibold text-sm">Internal Mail</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <input type="text" placeholder="Search" className="pl-9 pr-4 py-1.5 bg-white/20 border-transparent rounded text-sm text-white placeholder-white/70 focus:bg-white focus:text-stone-900 focus:placeholder-stone-500 outline-none transition-all w-96" />
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-[#F0F0F0] border-r border-stone-200 flex flex-col shrink-0">
          <div className="p-4 flex items-center justify-between">
            <h2 className="font-semibold text-stone-800">Teams</h2>
            <button className="text-stone-500 hover:text-stone-800"><Plus size={18} /></button>
          </div>
          <div className="px-2">
            <div className="mb-1 px-2 py-1 flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-[#464EB8] font-bold shadow-sm border border-stone-200 group-hover:border-[#464EB8]">
                A
              </div>
              <span className="font-semibold text-stone-800 text-sm">Ashberry Staff</span>
            </div>
            <nav className="space-y-0.5 ml-8 mt-1">
              {channels.map(c => (
                <button 
                  key={c.id}
                  onClick={() => setChannel(c.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium transition-colors ${
                    channel === c.id 
                      ? 'bg-white text-[#464EB8] shadow-sm' 
                      : 'text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <span className="opacity-70">{c.icon}</span>
                  {c.name}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white relative">
          <div className="h-14 border-b border-stone-200 flex items-center px-6 shrink-0 shadow-sm bg-white z-10">
            <div className="flex items-center gap-2">
              <span className="text-stone-400">{channels.find(c => c.id === channel)?.icon}</span>
              <h2 className="font-semibold text-stone-900 text-lg">{channels.find(c => c.id === channel)?.name}</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-6 space-y-6 bg-white flex flex-col">
            {messages.filter(m => m.channel === channel).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-stone-500">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare size={32} className="text-stone-400" />
                </div>
                <h3 className="font-semibold text-stone-800 mb-1">Welcome to {channels.find(c => c.id === channel)?.name}</h3>
                <p className="text-sm">Be the first to start a conversation.</p>
              </div>
            ) : (
              messages.filter(m => m.channel === channel).map((msg, i) => {
                const isMe = msg.authorName === userName;
                const timeString = msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sending...';
                
                return (
                  <motion.div 
                    key={msg.id || i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${isMe ? 'bg-[#464EB8]' : 'bg-stone-400'}`}>
                      {msg.authorName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-sm text-stone-900">{msg.authorName}</span>
                        <span className="text-xs text-stone-500">{timeString}</span>
                      </div>
                      <div className="text-stone-800 text-sm">
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="p-4 bg-white shrink-0">
            <div className="max-w-4xl mx-auto border border-stone-300 rounded-md focus-within:border-[#464EB8] focus-within:ring-1 focus-within:ring-[#464EB8] transition-all bg-white shadow-sm">
              <div className="px-2 py-1 border-b border-stone-100 flex items-center gap-1">
                <button className="p-1.5 hover:bg-stone-100 rounded text-stone-500"><Bold size={16} /></button>
                <button className="p-1.5 hover:bg-stone-100 rounded text-stone-500"><Italic size={16} /></button>
                <button className="p-1.5 hover:bg-stone-100 rounded text-stone-500"><Underline size={16} /></button>
              </div>
              <form onSubmit={handleSend} className="flex flex-col">
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder={`Start a new conversation in ${channels.find(c => c.id === channel)?.name}`} 
                  className="w-full resize-none outline-none px-4 py-3 text-sm text-stone-800 min-h-[80px]"
                />
                <div className="flex justify-between items-center px-2 py-2 border-t border-stone-100">
                  <div className="flex items-center gap-1">
                    <button type="button" className="p-1.5 hover:bg-stone-100 rounded text-stone-500"><Plus size={18} /></button>
                  </div>
                  <button 
                    type="submit"
                    disabled={!message.trim()}
                    className="bg-[#464EB8] hover:bg-[#3B429F] disabled:opacity-50 disabled:hover:bg-[#464EB8] text-white px-4 py-1.5 rounded flex items-center justify-center transition-colors text-sm font-medium"
                  >
                    <Send size={16} className="mr-2" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- 4. Safeguard Log (Incident Tracking Mock) ---
export function SafeguardApp({ onBack, userName, userRoles }: AppProps) {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [view, setView] = useState<'dashboard' | 'new_incident' | 'student_profile'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  
  // Form state
  const [studentName, setStudentName] = useState('');
  const [category, setCategory] = useState('Behavioral');
  const [severity, setSeverity] = useState('Low');
  const [details, setDetails] = useState('');

  const ROLE_SLT = "1480246451626836099";
  const ROLE_STAFF = "1480245806253736198";
  const canCreate = userRoles.includes(ROLE_SLT) || userRoles.includes(ROLE_STAFF);

  useEffect(() => {
    const q = query(collection(db, 'safeguard_logs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIncidents(logs);
    });
    return () => unsubscribe();
  }, []);

  const handleNewLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !studentName.trim() || !details.trim()) return;
    try {
      await addDoc(collection(db, 'safeguard_logs'), {
        student: studentName,
        category,
        status: 'Open',
        severity,
        details,
        authorId: auth.currentUser.uid,
        authorName: userName,
        createdAt: serverTimestamp()
      });
      setView('dashboard');
      setStudentName('');
      setDetails('');
    } catch (error) {
      console.error("Error creating log:", error);
    }
  };

  const renderDashboard = () => (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-stone-900">Dashboard</h2>
        <button onClick={() => setView('new_incident')} disabled={!canCreate} className="bg-[#005587] hover:bg-[#004466] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
          <Plus size={16} />
          Add Incident
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm border-t-4 border-t-[#005587]">
          <div className="text-stone-500 text-sm font-medium mb-1">Open Cases</div>
          <div className="text-3xl font-bold text-stone-900">{incidents.filter(i => i.status === 'Open').length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm border-t-4 border-t-emerald-500">
          <div className="text-stone-500 text-sm font-medium mb-1">Resolved This Month</div>
          <div className="text-3xl font-bold text-stone-900">{incidents.filter(i => i.status === 'Resolved').length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm border-t-4 border-t-rose-500">
          <div className="text-stone-500 text-sm font-medium mb-1">High Severity</div>
          <div className="text-3xl font-bold text-rose-600">{incidents.filter(i => i.severity === 'High').length}</div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-stone-900 mb-4">Recent Incidents</h3>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500">
            <tr>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Student</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Severity</th>
              <th className="px-6 py-4 font-medium">Reported By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-stone-500">No incidents found.</td>
              </tr>
            ) : incidents.map((inc, i) => (
              <tr key={inc.id || i} onClick={() => { setSelectedStudent(inc.student); setView('student_profile'); }} className="hover:bg-stone-50 cursor-pointer transition-colors">
                <td className="px-6 py-4 text-stone-900">{inc.createdAt?.toDate ? inc.createdAt.toDate().toLocaleDateString() : 'Just now'}</td>
                <td className="px-6 py-4 font-medium text-[#005587] hover:underline">{inc.student}</td>
                <td className="px-6 py-4 text-stone-600">{inc.category}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    inc.severity === 'Low' ? 'bg-emerald-100 text-emerald-700' :
                    inc.severity === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {inc.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-stone-600">{inc.authorName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderNewIncident = () => (
    <div className="p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setView('dashboard')} className="p-2 hover:bg-stone-200 rounded-full text-stone-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-stone-900">Add Incident</h2>
      </div>
      
      <form onSubmit={handleNewLog} className="bg-white border border-stone-200 rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Student Name</label>
          <input 
            type="text" 
            required
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            className="w-full border border-stone-300 rounded-md px-3 py-2 outline-none focus:border-[#005587] focus:ring-1 focus:ring-[#005587]"
            placeholder="Search for a student..."
          />
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border border-stone-300 rounded-md px-3 py-2 outline-none focus:border-[#005587] focus:ring-1 focus:ring-[#005587]"
            >
              <option>Behavioral</option>
              <option>Medical</option>
              <option>Welfare</option>
              <option>Attendance</option>
              <option>Safeguarding</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Severity</label>
            <select 
              value={severity}
              onChange={e => setSeverity(e.target.value)}
              className="w-full border border-stone-300 rounded-md px-3 py-2 outline-none focus:border-[#005587] focus:ring-1 focus:ring-[#005587]"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Incident Details</label>
          <textarea 
            required
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={6}
            className="w-full border border-stone-300 rounded-md px-3 py-2 outline-none focus:border-[#005587] focus:ring-1 focus:ring-[#005587] resize-none"
            placeholder="Provide a detailed factual account of the incident..."
          />
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
          <button type="button" onClick={() => setView('dashboard')} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-md font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" className="bg-[#005587] hover:bg-[#004466] text-white px-6 py-2 rounded-md font-medium transition-colors shadow-sm">
            Submit Incident
          </button>
        </div>
      </form>
    </div>
  );

  const renderStudentProfile = () => {
    const studentIncidents = incidents.filter(i => i.student === selectedStudent);
    
    return (
      <div className="p-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setView('dashboard')} className="p-2 hover:bg-stone-200 rounded-full text-stone-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-stone-900">{selectedStudent}&apos;s Profile</h2>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6 mb-6 flex items-center gap-6">
          <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
            <User size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">{selectedStudent}</h3>
            <p className="text-stone-500">Year 10 • Form 10A</p>
            <div className="mt-2 flex gap-2">
              <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-md text-xs font-medium border border-stone-200">Total Incidents: {studentIncidents.length}</span>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-stone-900 mb-4">Incident History</h3>
        <div className="space-y-4">
          {studentIncidents.map((inc, i) => (
            <div key={inc.id || i} className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-stone-900">{inc.category}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      inc.severity === 'Low' ? 'bg-emerald-100 text-emerald-700' :
                      inc.severity === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500">
                    Reported by {inc.authorName} on {inc.createdAt?.toDate ? inc.createdAt.toDate().toLocaleString() : 'Just now'}
                  </div>
                </div>
              </div>
              <p className="text-sm text-stone-700 whitespace-pre-wrap bg-stone-50 p-3 rounded-md border border-stone-100">
                {inc.details || "No details provided."}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-[#005587] h-14 flex items-center px-4 justify-between shrink-0 text-white shadow-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={20} />
            <span className="font-bold text-lg tracking-wide">CPOMS</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="opacity-80">Logged in as {userName}</span>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <User size={16} />
          </div>
        </div>
      </header>
      <main className="flex-grow overflow-auto">
        {view === 'dashboard' && renderDashboard()}
        {view === 'new_incident' && renderNewIncident()}
        {view === 'student_profile' && renderStudentProfile()}
      </main>
    </div>
  );
}

// --- 5. Curriculum Planner (Google Classroom Mock) ---
export function PlannerApp({ onBack, userName }: AppProps) {
  const [view, setView] = useState<'dashboard' | 'class'>('dashboard');
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [classTab, setClassTab] = useState<'stream' | 'classwork' | 'people' | 'marks'>('stream');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [newPostContent, setNewPostContent] = useState('');
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSection, setNewClassSection] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'classroom_classes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const q = query(collection(db, `classroom_classes/${selectedClass.id}/posts`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass) return;
    const q = query(collection(db, `classroom_classes/${selectedClass.id}/assignments`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [selectedClass]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newClassName.trim()) return;
    try {
      await addDoc(collection(db, 'classroom_classes'), {
        name: newClassName,
        section: newClassSection,
        authorId: auth.currentUser.uid,
        authorName: userName,
        createdAt: serverTimestamp()
      });
      setShowCreateClass(false);
      setNewClassName('');
      setNewClassSection('');
    } catch (error) {
      console.error("Error creating class:", error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedClass || !newPostContent.trim()) return;
    try {
      await addDoc(collection(db, `classroom_classes/${selectedClass.id}/posts`), {
        content: newPostContent,
        authorId: auth.currentUser.uid,
        authorName: userName,
        createdAt: serverTimestamp()
      });
      setNewPostContent('');
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleCreateAssignment = async () => {
    if (!auth.currentUser || !selectedClass) return;
    try {
      await addDoc(collection(db, `classroom_classes/${selectedClass.id}/assignments`), {
        title: `New Assignment ${assignments.length + 1}`,
        description: 'Please complete the attached worksheet.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        authorId: auth.currentUser.uid,
        authorName: userName,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creating assignment:", error);
    }
  };

  const renderDashboard = () => (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {showCreateClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200">
              <h3 className="text-lg font-medium text-stone-900">Create class</h3>
            </div>
            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Class name (required)" 
                  required
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full border-b-2 border-stone-300 px-2 py-3 outline-none focus:border-emerald-600 bg-stone-50 rounded-t-md transition-colors"
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Section" 
                  value={newClassSection}
                  onChange={e => setNewClassSection(e.target.value)}
                  className="w-full border-b-2 border-stone-300 px-2 py-3 outline-none focus:border-emerald-600 bg-stone-50 rounded-t-md transition-colors"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateClass(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-md font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!newClassName.trim()} className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:hover:bg-transparent rounded-md font-medium transition-colors">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {classes.map((cls, i) => (
          <div 
            key={cls.id || i} 
            onClick={() => { setSelectedClass(cls); setView('class'); setClassTab('stream'); }}
            className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-72"
          >
            <div className="h-24 bg-emerald-600 p-4 relative">
              <h3 className="text-white font-medium text-xl truncate hover:underline">{cls.name}</h3>
              <p className="text-emerald-100 text-sm truncate">{cls.section}</p>
              <div className="absolute -bottom-8 right-4 w-16 h-16 bg-emerald-100 rounded-full border-4 border-white flex items-center justify-center text-emerald-700 text-xl font-bold">
                {cls.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-grow p-4 pt-12">
              <p className="text-xs text-stone-500 font-medium">Due soon</p>
              <p className="text-sm text-stone-600 mt-1">No work due soon</p>
            </div>
            <div className="border-t border-stone-200 p-3 flex justify-end gap-2">
              <button className="p-2 hover:bg-stone-100 rounded-full text-stone-500 transition-colors">
                <Folder size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {classes.length === 0 && (
        <div className="text-center py-20 text-stone-500">
          <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
          <p>No classes found. Create one to get started.</p>
        </div>
      )}
    </div>
  );

  const renderClassView = () => (
    <div className="flex flex-col h-full">
      <div className="border-b border-stone-200 bg-white px-6 flex items-center justify-center gap-8 shrink-0">
        {(['stream', 'classwork', 'people', 'marks'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setClassTab(tab)}
            className={`py-4 px-2 font-medium text-sm capitalize border-b-4 transition-colors ${
              classTab === tab ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-grow overflow-auto p-6 max-w-5xl mx-auto w-full">
        {classTab === 'stream' && (
          <div className="space-y-6">
            <div className="h-48 rounded-xl bg-emerald-600 p-6 flex flex-col justify-end relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <div className="relative z-10">
                <h1 className="text-3xl font-bold text-white mb-1">{selectedClass.name}</h1>
                <p className="text-emerald-100 text-lg">{selectedClass.section}</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="w-48 shrink-0 hidden md:block">
                <div className="border border-stone-200 rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-medium text-stone-900 mb-2">Upcoming</h3>
                  <p className="text-sm text-stone-500 mb-4">No work due soon</p>
                  <a href="#" className="text-sm font-medium text-emerald-600 hover:underline">View all</a>
                </div>
              </div>
              <div className="flex-grow space-y-6">
                <div className="border border-stone-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <form onSubmit={handleCreatePost} className="p-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow">
                        <textarea 
                          value={newPostContent}
                          onChange={e => setNewPostContent(e.target.value)}
                          placeholder="Announce something to your class"
                          className="w-full bg-stone-50 hover:bg-stone-100 focus:bg-white border border-transparent focus:border-emerald-600 rounded-md px-4 py-3 outline-none transition-colors resize-none min-h-[100px]"
                        />
                        <div className="mt-3 flex justify-end">
                          <button 
                            type="submit" 
                            disabled={!newPostContent.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white px-6 py-2 rounded-md font-medium transition-colors text-sm"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {posts.map((post, i) => (
                  <div key={post.id || i} className="border border-stone-200 rounded-lg bg-white shadow-sm p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold shrink-0">
                        {post.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-stone-900">{post.authorName}</div>
                        <div className="text-xs text-stone-500">{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Just now'}</div>
                      </div>
                    </div>
                    <p className="text-stone-800 whitespace-pre-wrap">{post.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {classTab === 'classwork' && (
          <div>
            <div className="mb-6">
              <button onClick={handleCreateAssignment} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors flex items-center gap-2 shadow-sm">
                <Plus size={20} />
                Create
              </button>
            </div>
            
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="text-center py-20 text-stone-500 border-t border-stone-200 mt-8">
                  <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg mb-2">This is where you&apos;ll assign work</p>
                  <p className="text-sm">You can add assignments and other work for the class, then organize it into topics</p>
                </div>
              ) : assignments.map((assign, i) => (
                <div key={assign.id || i} className="border border-stone-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center p-4 gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-stone-100 group-hover:bg-emerald-100 flex items-center justify-center text-stone-500 group-hover:text-emerald-600 transition-colors shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium text-stone-900">{assign.title}</h4>
                    <p className="text-sm text-stone-500">Due {new Date(assign.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {classTab === 'people' && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <div className="flex justify-between items-center border-b-2 border-emerald-600 pb-4 mb-4">
                <h2 className="text-3xl text-emerald-700 font-normal">Teachers</h2>
                <button className="p-2 hover:bg-stone-100 rounded-full text-stone-500 transition-colors">
                  <UserPlus size={20} />
                </button>
              </div>
              <div className="flex items-center gap-4 py-2 px-4 hover:bg-stone-50 rounded-md transition-colors">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                  {selectedClass.authorName.charAt(0).toUpperCase()}
                </div>
                <span className="text-stone-900">{selectedClass.authorName}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center border-b-2 border-emerald-600 pb-4 mb-4">
                <h2 className="text-3xl text-emerald-700 font-normal">Students</h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-emerald-700">0 students</span>
                  <button className="p-2 hover:bg-stone-100 rounded-full text-stone-500 transition-colors">
                    <UserPlus size={20} />
                  </button>
                </div>
              </div>
              <div className="py-8 text-center text-stone-500">
                <p>Invite students or give them the class code</p>
                <div className="mt-4 inline-block px-4 py-2 border border-stone-200 rounded-md bg-stone-50 font-mono text-lg tracking-widest text-emerald-700">
                  {selectedClass.id?.substring(0, 7) || 'a1b2c3d'}
                </div>
              </div>
            </div>
          </div>
        )}

        {classTab === 'marks' && (
          <div className="text-center py-20 text-stone-500">
            <p className="text-lg">No students in this class</p>
            <p className="text-sm mt-2">Add students in the People tab to start grading</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-stone-200 h-16 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => view === 'class' ? setView('dashboard') : onBack()} className="p-2 hover:bg-stone-100 rounded-full text-stone-600 transition-colors">
            {view === 'class' ? <ArrowLeft size={20} /> : <ArrowLeft size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <BookOpen size={24} className="text-emerald-600" />
            <span className="font-medium text-xl text-stone-600">Classroom</span>
            {view === 'class' && (
              <>
                <span className="text-stone-300 mx-1">›</span>
                <span className="font-medium text-stone-900 truncate max-w-[200px]">{selectedClass?.name}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view === 'dashboard' && (
            <button onClick={() => setShowCreateClass(true)} className="p-2 hover:bg-stone-100 rounded-full text-stone-600 transition-colors">
              <Plus size={24} />
            </button>
          )}
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold ml-2">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>
      
      <main className="flex-grow overflow-hidden flex flex-col">
        {view === 'dashboard' ? renderDashboard() : renderClassView()}
      </main>
    </div>
  );
}
