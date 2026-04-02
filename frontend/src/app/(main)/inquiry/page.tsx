'use client';

import { useState } from 'react';
import { useIMEInput } from '@/hooks/useIMEInput';
import { useRouter } from 'next/navigation';
import Back from '@/components/Back';
import { useApiPost } from '@/hooks/useApi';
import { toast } from 'sonner';

const CATEGORIES = ['버그 신고', '기능 제안', '계정/로그인 문제', '기타'];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InquiryPage() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [otherText, setOtherText] = useState('');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const otherTextImeProps = useIMEInput(setOtherText);
  const contentImeProps = useIMEInput(setContent);
  const emailImeProps = useIMEInput(setEmail);

  const { mutate: submit, isPending } = useApiPost('/api/inquiries', {
    onSuccess: () => {
      toast.success('문의가 접수되었습니다. 감사합니다!');
      router.back();
    },
    onError: () => {
      toast.error('문의 접수 중 오류가 발생했습니다. 다시 시도해 주세요.');
    },
  });

  const emailError = email && !isValidEmail(email);
  const resolvedCategory =
    category === '기타' && otherText.trim()
      ? `기타: ${otherText.trim()}`
      : category;

  const isValid =
    category &&
    (category !== '기타' || otherText.trim()) &&
    content.trim() &&
    !emailError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, string> = {
      category: resolvedCategory,
      content,
    };
    if (email.trim()) body.email = email.trim();
    submit(body);
  };

  return (
    <div
      className="w-full flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black"
      style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
    >
      <header className="sticky top-0 z-50 max-w-4xl w-full mx-auto px-4 py-3 sm:px-5 sm:py-6 flex items-center justify-between dark:bg-[#121212] bg-white transition-all duration-500">
        <Back fallback="/profile" />
        <h2 className="text-sm sm:text-base font-medium dark:text-white text-itta-black">
          문의하기
        </h2>
        <div className="w-6 h-6" />
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-5 py-4 sm:py-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          서비스 이용 중 불편한 점, 버그, 기능 제안 등 무엇이든 남겨주세요.
          {'\n'}
          답변이 필요하신 경우 이메일을 남겨주시면 순차적으로 답변드리겠습니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 문의 유형 */}
          <div className="space-y-5">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">
              문의 유형 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2.5">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={category === cat}
                    onChange={() => setCategory(cat)}
                    className="w-4 h-4 accent-itta-black dark:accent-white"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {cat === '기타' ? '기타' : cat}
                  </span>
                  {cat === '기타' && category === '기타' && (
                    <input
                      value={otherText}
                      {...otherTextImeProps}
                      placeholder="직접 입력"
                      maxLength={80}
                      className="flex-1 h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1E1E] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* 문의 내용 */}
          <div className="mt-2 space-y-2">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">
              문의 내용 <span className="text-red-500">*</span>
            </label>
            <p className="mt-2 text-xs text-gray-400">
              최대한 자세히 작성해주시면 빠른 확인에 도움이 됩니다.
            </p>
            <textarea
              value={content}
              {...contentImeProps}
              placeholder="내 답변"
              rows={6}
              maxLength={2000}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1E1E1E] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 resize-none"
            />
            <p className="text-right text-[11px] text-gray-400">
              {content.length} / 2000
            </p>
          </div>

          {/* 이메일 */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">
              이메일
            </label>
            <p className="mt-2 text-xs text-gray-400">
              답변이 필요하신 경우에만 입력해주세요.
            </p>
            <input
              type="text"
              value={email}
              {...emailImeProps}
              placeholder="내 답변"
              className={`w-full h-11 px-4 rounded-xl border bg-gray-50 dark:bg-[#1E1E1E] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                emailError
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-gray-300 dark:focus:ring-gray-600'
              }`}
            />
            {emailError && (
              <p className="text-xs text-red-500">
                유효한 이메일 형식이 아닙니다.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isPending}
            className="w-full h-12 rounded-xl bg-itta-black dark:bg-white text-white dark:text-black text-sm font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
          >
            {isPending ? '접수 중...' : '제출'}
          </button>
        </form>
      </main>
    </div>
  );
}
