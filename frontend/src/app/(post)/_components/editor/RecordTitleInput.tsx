'use client';

interface RecordTitleInputProps {
  value?: string;
  onChange: (val: string) => void;
}

export default function RecordTitleInput({
  value,
  onChange,
}: RecordTitleInputProps) {
  return (
    <input
      type="text"
      placeholder="제목을 입력하세요"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border-none focus:ring-0 outline-none text-xl font-semibold tracking-tight bg-transparent p-0 text-[#333333] placeholder-gray-200 dark:text-white dark:placeholder-gray-700"
    />
  );
}
