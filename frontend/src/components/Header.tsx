import { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  rightContent?: ReactNode;
}

export default function Header({ title, rightContent }: HeaderProps) {
  return (
    <header className="w-full px-6 py-8 pb-5.5 border-b-[0.5] border-itta-gray2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-itta-black">{title}</h1>

        <div className="flex items-center space-x-2">{rightContent}</div>
      </div>
    </header>
  );
}
