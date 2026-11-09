import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, CheckCircle, Trash2, X, Filter, Download } from 'lucide-react';
import { db, storage, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { SharedResource, UserStats, CourseId } from '../types';
import { getCourseConfig, filterByCourse, withCourse } from '../courseConfig';
import { motion, AnimatePresence } from 'motion/react';

interface CommunityLibraryProps {
  userStats: UserStats;
  activeCourse?: CourseId;
}

const CATEGORIES = ['All', 'Networking', 'Hardware', 'Troubleshooting', 'Other'] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<string, string> = {
  'Networking': 'bg-blue-500',
  'Hardware': 'bg-green-500',
  'Troubleshooting': 'bg-orange-500',
  'Other': 'bg-gray-500'
};

const CommunityLibrary: React.FC<CommunityLibraryProps> = ({ userStats, activeCourse = 'a-plus' }) => {
  const courseConfig = getCourseConfig(activeCourse);
  const [resources, setResources] = useState<SharedResource[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SharedResource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Upload Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Networking');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'shared_resources'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SharedResource));
      setResources(filterByCourse(resData, activeCourse));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'shared_resources'));

    return () => unsubscribe();
  }, [activeCourse]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Basic validation: only images and pdfs
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        setError('Please select an image or PDF file.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title for your resource.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!userStats.uid || !auth.currentUser?.email) {
      setError("You must be logged in to upload.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsUploading(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const storageRef = ref(storage, `resources/${activeCourse}/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload failed", error);
          setIsUploading(false);
          setError(`Upload failed: ${error.message}. If this persists, Firebase Storage might not be enabled for this project.`);
          setTimeout(() => setError(null), 5000);
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            await addDoc(collection(db, 'shared_resources'), withCourse({
              title: title.trim(),
              category,
              url: downloadURL,
              uploaderName: auth.currentUser!.email!.split('@')[0],
              uploaderUid: userStats.uid,
              timestamp: new Date().toISOString(),
              verified: false,
              fileType: file.type.startsWith('image/') ? 'image' : 'pdf'
            }, activeCourse));

            // Reset form
            setShowUploadModal(false);
            setTitle('');
            setFile(null);
            setUploadProgress(0);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'shared_resources');
          } finally {
            setIsUploading(false);
          }
        }
      );
    } catch (error: any) {
      console.error("Storage error:", error);
      setIsUploading(false);
      setError(`Storage error: ${error.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete || !confirmDelete.id) return;
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'shared_resources', confirmDelete.id));
      
      // Try to delete from Storage (might fail if URL is external, but we handle it)
      try {
        const urlObj = new URL(confirmDelete.url);
        const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
        const fileRef = ref(storage, path);
        await deleteObject(fileRef);
      } catch (e) {
        console.warn("Could not delete file from storage, might be external or already deleted.", e);
      }
      setConfirmDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shared_resources/${confirmDelete.id}`);
    }
  };

  const handleDelete = (resource: SharedResource) => {
    if (!resource.id || userStats.role !== 'admin') return;
    setConfirmDelete(resource);
  };

  const handleVerify = async (resourceId: string, currentStatus: boolean) => {
    if (userStats.role !== 'admin') return;
    try {
      await updateDoc(doc(db, 'shared_resources', resourceId), {
        verified: !currentStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shared_resources/${resourceId}`);
    }
  };

  const filteredResources = activeCategory === 'All' 
    ? resources 
    : resources.filter(r => r.category === activeCategory);

  return (
    <>
      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-red-600/40"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] max-w-md w-full relative shadow-2xl text-[var(--text-main)]"
            >
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="text-rose-500 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter mb-2">Confirm <span className="text-rose-500">Deletion</span></h3>
              <p className="text-[var(--text-muted)] mb-8 text-sm">
                Are you sure you want to delete this resource? This action cannot be undone.
                <span className="block mt-2 text-[var(--text-main)] font-bold italic truncate">"{confirmDelete.title}"</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3.5 bg-[var(--bg-surface)] hover:bg-[var(--border-color)] text-[var(--text-main)] rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors shadow-lg shadow-rose-600/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 md:p-8 rounded-[2rem] mb-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight flex items-center gap-3">
            Community Library
            <span className="px-3 py-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-full text-[var(--text-muted)] text-[10px] font-black tracking-widest">
              {resources.length} Resources
            </span>
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Shared study materials, cheat sheets, and guides.</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-color)] overflow-x-auto hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-md shrink-0 hover:opacity-90"
            style={{ backgroundColor: courseConfig.accentHex }}
          >
            <Upload size={16} /> Upload
          </button>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] border-dashed">
          <FileText size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-40" />
          <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight mb-2">The library is empty!</h3>
          <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
            Be the first to upload a port list, subnetting cheat sheet, or study guide and earn a 'Contributor' badge.
          </p>
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar snap-x">
          {filteredResources.map(resource => (
            <div 
              key={resource.id} 
              className="min-w-[280px] max-w-[280px] bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] overflow-hidden group snap-start relative flex flex-col shadow-sm"
            >
              {/* Category Color Bar */}
              <div className={`h-1.5 w-full ${CATEGORY_COLORS[resource.category] || CATEGORY_COLORS['Other']}`} />
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${resource.fileType === 'pdf' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {resource.fileType === 'pdf' ? <FileText size={24} /> : <ImageIcon size={24} />}
                  </div>
                  
                  {resource.verified && (
                    <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest" title="Verified by Instructor">
                      <CheckCircle size={12} /> Verified
                    </div>
                  )}
                </div>

                <h3 className="text-base font-black text-[var(--text-main)] leading-tight mb-2 line-clamp-2" title={resource.title}>
                  {resource.title}
                </h3>
                
                <div className="text-xs text-[var(--text-muted)] font-medium mb-6">
                  Uploaded by <span className="text-[var(--text-main)] font-semibold">{resource.uploaderName}</span>
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-main)] py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors border border-[var(--border-color)]"
                  >
                    <Download size={14} /> View
                  </a>
                  
                  {userStats.role === 'admin' && (
                    <>
                      <button 
                        onClick={() => handleVerify(resource.id!, resource.verified)}
                        className={`p-2.5 rounded-xl transition-colors ${resource.verified ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'}`}
                        title={resource.verified ? "Unverify" : "Verify"}
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(resource)}
                        className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                        title="Delete Resource"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 md:p-8 rounded-[2rem] max-w-md w-full shadow-2xl text-[var(--text-main)]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">Upload Resource</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1">
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Common Port Numbers Cheat Sheet"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3.5 text-[var(--text-main)] focus:outline-none focus:border-indigo-500 transition-colors appearance-none text-sm font-semibold"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">File (PDF or Image)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[var(--border-color)] hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-[var(--bg-surface)]"
                  >
                    {file ? (
                      <div className="flex flex-col items-center">
                        {file.type === 'application/pdf' ? <FileText size={32} className="text-rose-500 mb-2" /> : <ImageIcon size={32} className="text-blue-500 mb-2" />}
                        <span className="text-sm font-medium text-[var(--text-main)] truncate max-w-full px-4">{file.name}</span>
                        <span className="text-xs text-[var(--text-muted)] mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload size={32} className="text-[var(--text-muted)] mb-2" />
                        <span className="text-sm font-medium text-[var(--text-muted)]">Click to browse files</span>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*,application/pdf" 
                    className="hidden" 
                  />
                </div>

                {isUploading && (
                  <div className="w-full bg-[var(--bg-surface)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                <button 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full py-3.5 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ backgroundColor: courseConfig.accentHex }}
                >
                  {isUploading ? 'Uploading...' : 'Share Resource'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </>
  );
};

export default CommunityLibrary;
