import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, FolderKanban, Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { globalSearch } from '../services/api';
import type { Document, Project, User } from '../types';

interface SearchResult {
  projects: Project[];
  users: User[];
  documents: Document[];
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({ projects: [], users: [], documents: [] });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults({ projects: [], users: [], documents: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await globalSearch(term);
        setResults({
          projects: res.data.projects ?? [],
          users: res.data.users ?? [],
          documents: res.data.documents ?? [],
        });
      } catch {
        setResults({ projects: [], users: [], documents: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const isEmpty = useMemo(
    () => !loading && query.trim() && results.projects.length + results.users.length + results.documents.length === 0,
    [loading, query, results]
  );

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      <div className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-1.5 border border-transparent focus-within:border-indigo-300 transition">
        <Search size={15} className="text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-40">
          {loading && <p className="text-sm text-gray-500 px-4 py-3">Đang tìm kiếm...</p>}

          {!loading && (
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              <section className="px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                  <FolderKanban size={12} /> Dự án
                </p>
                {results.projects.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2 py-1">Không có dự án</p>
                ) : (
                  results.projects.map((p) => (
                    <Link
                      key={p.projectId}
                      to={`/projects/${p.projectId}`}
                      onClick={() => setOpen(false)}
                      className="block px-2 py-2 rounded-lg hover:bg-gray-50"
                    >
                      <p className="text-sm text-gray-800 font-medium truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.projectCode}</p>
                    </Link>
                  ))
                )}
              </section>

              <section className="px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                  <Users size={12} /> Người dùng
                </p>
                {results.users.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2 py-1">Không có người dùng</p>
                ) : (
                  results.users.map((u) => (
                    <Link
                      key={u.userId}
                      to="/company"
                      onClick={() => setOpen(false)}
                      className="block px-2 py-2 rounded-lg hover:bg-gray-50"
                    >
                      <p className="text-sm text-gray-800 truncate">{u.companyEmail}</p>
                      <p className="text-xs text-gray-400">{u.systemUserId}</p>
                    </Link>
                  ))
                )}
              </section>

              <section className="px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                  <FileText size={12} /> Tài liệu
                </p>
                {results.documents.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2 py-1">Không có tài liệu</p>
                ) : (
                  results.documents.map((d) => (
                    <Link
                      key={d.documentId}
                      to={`/projects/${d.projectId}`}
                      onClick={() => setOpen(false)}
                      className="block px-2 py-2 rounded-lg hover:bg-gray-50"
                    >
                      <p className="text-sm text-gray-800 truncate">{d.internalPath ?? d.cloudUrl ?? `Tài liệu #${d.documentId}`}</p>
                      <p className="text-xs text-gray-400">{(d.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
                    </Link>
                  ))
                )}
              </section>
            </div>
          )}

          {isEmpty && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-gray-500">Không tìm thấy kết quả</p>
              <p className="text-xs text-gray-400 mt-1">Hãy thử từ khóa khác.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
