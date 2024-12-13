type MenuIconProps = {
  isOpen?: boolean;
};

export const MenuIcon = ({ isOpen }: MenuIconProps) => {
  return (
    <div className="flex flex-col justify-between w-6 h-5">
      <span className={`h-0.5 w-full bg-current transform transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
      <span className={`h-0.5 w-full bg-current transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
      <span className={`h-0.5 w-full bg-current transform transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
    </div>
  );
};
