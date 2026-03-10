import { useMemo, useState } from 'react';
import { AlertTriangle, Upload, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { fileSizeBytes: number; cloudUrl?: string; taskId?: number; fileName?: string }) => Promise<void>;
}

const LIMIT = 20 * 1024 * 1024;

export default function DocumentUploadModal({ isOpen, onClose, onSubmit }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [cloudUrl, setCloudUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isLargeFile = useMemo(() => !!file && file.size > LIMIT, [file]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please choose a file.');
      return;
    }

    if (isLargeFile && !cloudUrl.trim()) {
      setError('Cloud URL is required for files larger than 20MB.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        fileSizeBytes: file.size,
        cloudUrl: isLargeFile ? cloudUrl.trim() : undefined,
        fileName: file.name,
      });
      setFile(null);
      setCloudUrl('');
      onClose();
    } catch {
      setError('Failed to upload document.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Upload Document</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="document-file-input" className="block text-sm font-medium text-gray-700 mb-1">Select file</label>
            <input
              id="document-file-input"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
            {file && (
              <p className="text-xs text-gray-500 mt-1">
                {file.name} • {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>

          {isLargeFile && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-sm flex gap-2 items-start">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">File exceeds 20MB. Please use cloud storage.</p>
                <p className="text-xs mt-0.5">Provide a cloud link for this file below.</p>
              </div>
            </div>
          )}

          {isLargeFile && (
            <div>
              <label htmlFor="document-cloud-url-input" className="block text-sm font-medium text-gray-700 mb-1">Cloud URL</label>
              <input
                id="document-cloud-url-input"
                type="url"
                value={cloudUrl}
                onChange={(e) => setCloudUrl(e.target.value)}
                placeholder="https://drive.example.com/file/..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {!isLargeFile && file && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs">
              File size is within 20MB. Standard internal upload will be used.
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition inline-flex items-center justify-center gap-1.5">
              <Upload size={14} /> {saving ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
