import Back from '@/components/Back';

export default function ProfileHeaderActions() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md px-4 py-3 sm:px-5 sm:py-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/95 bg-white/95">
      <Back />
      <h2 className="text-[13px] sm:text-sm font-bold dark:text-white text-itta-black">
        마이페이지
      </h2>
      <div className="w-6 sm:w-8" />
    </header>
  );
}
