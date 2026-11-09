import React, { useState, useEffect } from 'react';
import { FolderPlus, FilePlus, Folder, File as FileIcon, MoreVertical, Trash2, Loader2, Download, XCircle, ArrowLeft } from 'lucide-react';
import { db, auth, storage, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, handleFirestoreError, OperationType, ref, uploadBytesResumable, getDownloadURL, deleteObject, deleteDoc, doc } from '../firebase';
import { CourseId } from '../types';
import { getCourseConfig, filterByCourse, withCourse } from '../courseConfig';
import Modal from './Modal';

interface FolderData {
  id: string;
  name: string;
  createdAt: any;
  course?: CourseId;
}

interface FileData {
  id: string;
  name: string;
  folderId?: string;
  size: number;
  type: string;
  storagePath: string;
  downloadURL: string;
  createdAt: any;
  course?: CourseId;
}

interface FileSectionProps {
  activeCourse?: CourseId;
}

const FileSection: React.FC<FileSectionProps> = ({ activeCourse = 'a-plus' }) => {
  const courseConfig = getCourseConfig(activeCourse);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const foldersRef = collection(db, 'users', uid, 'folders');
    const filesRef = collection(db, 'users', uid, 'files');

    const qFolders = query(foldersRef, orderBy('createdAt', 'desc'));
    const qFiles = query(filesRef, orderBy('createdAt', 'desc'));

    const unsubFolders = onSnapshot(qFolders, (snapshot) => {
      const rawFolders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FolderData));
      setFolders(filterByCourse(rawFolders, activeCourse));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/folders`));

    const unsubFiles = onSnapshot(qFiles, (snapshot) => {
      const rawFiles = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FileData));
      setFiles(filterByCourse(rawFiles, activeCourse));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/files`));

    return () => {
      unsubFolders();
      unsubFiles();
    };
  }, [activeCourse]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !auth.currentUser) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'folders'), withCourse({
        name: newFolderName,
        createdAt: serverTimestamp()
      }, activeCourse));
      setNewFolderName('');
      setIsFolderModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'folders');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !auth.currentUser) return;

    setSubmitting(true);
    setUploadError(null);
    setUploadProgress(0);

    const uid = auth.currentUser.uid;
    const fileId = Math.random().toString(36).substring(2, 15);
    const storagePath = `user_uploads/${uid}/${fileId}-${selectedFile.name}`;
    const storageRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload failed:", error);
        setUploadError("Upload failed. Please check your connection and try again.");
        setSubmitting(false);
        setUploadProgress(null);
      }, 
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, 'users', uid, 'files'), withCourse({
            name: selectedFile.name,
            folderId: selectedFolderId || null,
            size: selectedFile.size,
            type: selectedFile.type,
            storagePath: storagePath,
            downloadURL: downloadURL,
            createdAt: serverTimestamp()
          }, activeCourse));

          setSelectedFile(null);
          setSelectedFolderId('');
          setIsFileModalOpen(false);
          setUploadProgress(null);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'files');
          setUploadError("Failed to save file metadata.");
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  const handleDeleteFile = async (file: FileData) => {
    if (!auth.currentUser) return;
    
    try {
      // 1. Delete from Storage
      const storageRef = ref(storage, file.storagePath);
      await deleteObject(storageRef);
      
      // 2. Delete from Firestore
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'files', file.id));
    } catch (err) {
      console.error("Delete failed:", err);
      // Even if storage delete fails (e.g. file missing), try to clean up Firestore
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'files', file.id));
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.DELETE, `files/${file.id}`);
      }
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const MAX_FILES = 5;
  const isLimitReached = files.length >= MAX_FILES;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="text-red-600 animate-spin" size={32} />
      </div>
    );
  }

  const currentFolder = folders.find(f => f.id === currentFolderId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentFolderId && (
            <button 
              onClick={() => setCurrentFolderId(null)}
              className="p-2 bg-[var(--bg-panel)] hover:bg-[var(--hover-bg)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl transition-all"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-main)]">
              {currentFolder ? currentFolder.name : 'Course'} Files
            </h2>
            <p className="text-[var(--text-muted)] text-xs font-medium mt-1">
              {currentFolder ? 'Viewing folder contents' : 'Manage your course notes, scripts, and guides'}
            </p>
          </div>
        </div>
        <div className="flex gap-2.5">
          {!currentFolderId && (
            <button 
              onClick={() => setIsFolderModalOpen(true)}
              className="bg-[var(--bg-panel)] hover:bg-[var(--hover-bg)] text-[var(--text-main)] px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider border border-[var(--border-color)]"
            >
              <FolderPlus size={16} className="text-indigo-500" />
              <span className="hidden sm:inline">New Folder</span>
            </button>
          )}
        </div>
      </div>

      {folders.length === 0 && files.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-3xl p-8 md:p-16 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-[var(--bg-panel)] rounded-full flex items-center justify-center mx-auto mb-5 text-[var(--text-muted)]">
            <Folder size={28} />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-[var(--text-main)] tracking-tight mb-2">Vault is Empty</h3>
          <p className="text-[var(--text-secondary)] text-sm max-w-xs mx-auto font-normal">Start organizing your IT resources by creating folders or adding files.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Folders - only show in root */}
          {!currentFolderId && folders.map(folder => (
            <div 
              key={folder.id} 
              onClick={() => setCurrentFolderId(folder.id)}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-2xl hover:border-[var(--border-strong)] hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Folder size={22} />
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
              <h4 className="text-[var(--text-main)] font-bold text-base truncate leading-snug">{folder.name}</h4>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
                {files.filter(f => f.folderId === folder.id).length} Files
              </p>
            </div>
          ))}

          {/* Files - filter by current folder */}
          {files.filter(f => f.folderId === (currentFolderId || null)).map(file => (
            <div key={file.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-2xl hover:border-[var(--border-strong)] hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-[var(--bg-panel)] text-[var(--text-muted)] rounded-xl">
                  <FileIcon size={22} />
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleDownload(file.downloadURL)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteFile(file)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h4 className="text-[var(--text-main)] font-semibold text-sm truncate leading-snug">{file.name}</h4>
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--border-color)]">
                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                  {file.type.split('/')[1]?.toUpperCase() || 'FILE'} • {formatSize(file.size)}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                  {file.createdAt?.toDate()?.toLocaleDateString() || 'Recent'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <div className="fixed bottom-8 left-1/2 lg:left-[calc(50%+100px)] -translate-x-1/2 z-40 flex flex-col items-center gap-3">
        {isLimitReached && (
          <div className="bg-[var(--bg-card)]/95 backdrop-blur-md border border-amber-500/30 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-xl animate-in fade-in slide-in-from-bottom-2 w-[90vw] max-w-sm">
            <div className="flex flex-col">
              <span className="text-[var(--text-main)] text-xs font-bold">Free Plan Limit</span>
              <span className="text-[var(--text-muted)] text-[11px]">You've reached the {MAX_FILES} file limit.</span>
            </div>
            <button 
              onClick={() => setIsUpgradeModalOpen(true)}
              className="bg-[var(--accent)] hover:opacity-90 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ml-auto"
            >
              Upgrade
            </button>
          </div>
        )}
        
        <button 
          onClick={() => {
            if (!isLimitReached) {
              setSelectedFolderId(currentFolderId || '');
              setIsFileModalOpen(true);
            }
          }}
          disabled={isLimitReached}
          className={`px-6 md:px-7 py-3 md:py-3.5 rounded-full transition-all flex items-center gap-2.5 text-xs md:text-sm font-bold uppercase tracking-wider shadow-lg border border-white/10 whitespace-nowrap ${
            isLimitReached 
              ? 'bg-[var(--bg-panel)] text-[var(--text-muted)] cursor-not-allowed opacity-50' 
              : 'bg-[var(--accent)] hover:opacity-95 text-white shadow-[var(--accent-glow)] hover:scale-105 active:scale-95'
          }`}
        >
          <FilePlus size={18} />
          <span>{isLimitReached ? 'Limit Reached' : 'Add File'}</span>
        </button>
      </div>

      {/* Modals */}
      <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title="New Folder">
        <form onSubmit={handleCreateFolder} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">Folder Name</label>
            <input
              type="text"
              required
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl py-3 px-4 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-all outline-none font-medium text-sm"
              placeholder="e.g. Study Guides"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setIsFolderModalOpen(false)}
              className="flex-1 bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-color)] py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[var(--hover-bg)] transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[var(--accent)] text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all disabled:opacity-50 shadow-md shadow-[var(--accent-glow)]"
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isFileModalOpen} onClose={() => !submitting && setIsFileModalOpen(false)} title="Upload File">
        <form onSubmit={handleAddFile} className="space-y-5">
          {uploadError && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-2.5 text-rose-500 text-xs font-semibold">
              <XCircle size={16} />
              {uploadError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">Select File</label>
            <div 
              onClick={() => !submitting && document.getElementById('file-input')?.click()}
              className={`w-full bg-[var(--bg-surface)] border border-dashed border-[var(--border-color)] rounded-2xl p-6 text-center cursor-pointer hover:border-[var(--accent)] transition-all ${selectedFile ? 'border-[var(--accent)]' : ''}`}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                disabled={submitting}
              />
              <FilePlus size={28} className={`mx-auto mb-3 ${selectedFile ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
              <p className="text-[var(--text-main)] font-semibold text-sm">
                {selectedFile ? selectedFile.name : 'Click to choose file'}
              </p>
              {selectedFile && (
                <p className="text-xs text-[var(--text-muted)] mt-1.5 font-medium">
                  {formatSize(selectedFile.size)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">Folder (Optional)</label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              disabled={submitting}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl py-3 px-4 text-[var(--text-main)] focus:border-[var(--accent)] transition-all outline-none font-medium text-sm disabled:opacity-50"
            >
              <option value="">No Folder</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {uploadProgress !== null && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent)] transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setIsFileModalOpen(false)}
              disabled={submitting}
              className="flex-1 bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-color)] py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[var(--hover-bg)] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting || !selectedFile}
              className="flex-1 bg-[var(--accent)] text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all disabled:opacity-50 shadow-md shadow-[var(--accent-glow)]"
            >
              {submitting ? 'Uploading...' : 'Start Upload'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} title="Storage Plan">
        <div className="space-y-5 text-center py-2">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FilePlus size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-[var(--text-main)]">Unlock Unlimited Storage</h3>
            <p className="text-[var(--text-muted)] text-sm max-w-xs mx-auto font-normal">
              The Free Plan is limited to {MAX_FILES} files. Upgrade to Pro for unlimited course resources, larger files, and fast downloads.
            </p>
          </div>
          <div className="pt-2">
            <button 
              onClick={() => setIsUpgradeModalOpen(false)}
              className="w-full bg-[var(--accent)] text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all shadow-md shadow-[var(--accent-glow)]"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FileSection;
