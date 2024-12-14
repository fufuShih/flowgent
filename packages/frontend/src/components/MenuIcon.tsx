type MenuIconProps = {
  isOpen?: boolean;
};

export const MenuIcon = ({ isOpen }: MenuIconProps) => {
  return (
    <div className="flex flex-col justify-between w-6 h-5">
      <span className={`h-0.5 w-full bg-current transform transition-all duration-300 origin-left ${isOpen ? 'scale-x-75' : ''}`} />
      <span className={`h-0.5 w-full bg-current transition-all duration-300 ${isOpen ? 'opacity-70' : ''}`} />
      <span className={`h-0.5 w-full bg-current transform transition-all duration-300 origin-left ${isOpen ? 'scale-x-75' : ''}`} />
    </div>
  );
};
