'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Plus, Trash2, Radio, CircleOff, Loader2 } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  createdAt: string;
}

interface FormState {
  title: string;
  content: string;
  imageUrl: string;
  isActive: boolean;
  startAt: string;
  endAt: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  content: '',
  imageUrl: '',
  isActive: false,
  startAt: '',
  endAt: '',
};

const SESSION_KEY = 'admin-key';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function adminFetch(path: string, key: string, options: RequestInit = {}) {
  return fetch(`${API_BASE}/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': key,
      ...(options.headers ?? {}),
    },
  });
}

// ─── Key Login Form ─────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: (key: string) => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminFetch('/admin/announcements', input);
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, input);
        onSuccess(input);
      } else if (res.status === 403) {
        setError('올바르지 않은 어드민 키입니다.');
      } else {
        setError('서버 오류가 발생했습니다.');
      }
    } catch {
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0F1115]">
      <div className="w-full max-w-sm bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            어드민
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            어드민 키를 입력하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="어드민 키"
            className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || !input}
            className="w-full h-11 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold disabled:opacity-40 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            입장
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Create / Edit Form ──────────────────────────────────────────────────────

function AnnouncementForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial: FormState;
  onSubmit: (form: FormState) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          제목 *
        </label>
        <input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="공지 제목"
          className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          maxLength={200}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          내용
        </label>
        <textarea
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          placeholder="공지 내용 (선택)"
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          이미지 URL
        </label>
        <input
          value={form.imageUrl}
          onChange={(e) => set('imageUrl', e.target.value)}
          placeholder="https://..."
          className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        {form.imageUrl && isValidUrl(form.imageUrl) && (
          <div className="relative w-full h-36 mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.imageUrl}
              alt="미리보기"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            게시 시작
          </label>
          <input
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => set('startAt', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            게시 종료
          </label>
          <input
            type="datetime-local"
            value={form.endAt}
            onChange={(e) => set('endAt', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set('isActive', e.target.checked)}
          className="w-4 h-4 rounded accent-gray-900 dark:accent-white"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          생성 즉시 활성화
        </span>
      </label>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          취소
        </button>
        <button
          onClick={() => onSubmit(form)}
          disabled={loading || !form.title.trim()}
          className="flex-1 h-10 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold disabled:opacity-40 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          저장
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

function Dashboard({ adminKey }: { adminKey: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await adminFetch('/admin/announcements', adminKey);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(Array.isArray(data) ? data : (data.data ?? []));
      }
    } finally {
      setFetching(false);
    }
  }, [adminKey]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleCreate = async (form: FormState) => {
    setSubmitting(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        isActive: form.isActive,
      };
      if (form.content) body.content = form.content;
      if (form.imageUrl) body.imageUrl = form.imageUrl;
      if (form.startAt) body.startAt = new Date(form.startAt).toISOString();
      if (form.endAt) body.endAt = new Date(form.endAt).toISOString();

      const res = await adminFetch('/admin/announcements', adminKey, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowCreate(false);
        await loadAnnouncements();
      } else {
        setError('생성에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: Announcement) => {
    setActionLoading(item.id);
    try {
      const res = await adminFetch(
        `/admin/announcements/${item.id}`,
        adminKey,
        {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !item.isActive }),
        },
      );
      if (res.ok) await loadAnnouncements();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setActionLoading(id);
    try {
      const res = await adminFetch(`/admin/announcements/${id}`, adminKey, {
        method: 'DELETE',
      });
      if (res.ok) await loadAnnouncements();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1115] pb-16">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            공지사항 관리
          </h1>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />새 공지
          </button>
        </div>

        {/* 생성 폼 */}
        {showCreate && (
          <AnnouncementForm
            initial={EMPTY_FORM}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={submitting}
          />
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* 목록 */}
        {fetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">
            등록된 공지사항이 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div
                key={item.id}
                className={`bg-white dark:bg-[#1E1E1E] rounded-2xl p-4 shadow-sm border ${
                  item.isActive
                    ? 'border-green-200 dark:border-green-800'
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                {/* 이미지 미리보기 */}
                {item.imageUrl && isValidUrl(item.imageUrl) && (
                  <div className="relative w-full h-32 mb-3 rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.isActive && (
                        <span className="shrink-0 text-[10px] font-bold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                          활성
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {item.title}
                      </h3>
                    </div>
                    {item.content && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 whitespace-pre-line">
                        {item.content}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleActive(item)}
                      disabled={actionLoading === item.id}
                      title={item.isActive ? '비활성화' : '활성화'}
                      className={`p-2 rounded-xl transition-colors ${
                        item.isActive
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {actionLoading === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : item.isActive ? (
                        <Radio className="w-4 h-4" />
                      ) : (
                        <CircleOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={actionLoading === item.id}
                      title="삭제"
                      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(SESSION_KEY);
  });

  if (!adminKey) {
    return <LoginForm onSuccess={setAdminKey} />;
  }

  return <Dashboard adminKey={adminKey} />;
}
