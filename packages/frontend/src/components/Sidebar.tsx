import { Github, X } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect } from 'react';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop - only for mobile */}
      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden ${
          isOpen ? "block" : "hidden"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 z-40
          h-[calc(100vh-4rem)]
          w-full lg:w-72
          border-r bg-background
          transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full py-6 px-4">
          {/* Close button - only for mobile */}
          <div className="flex justify-end lg:hidden mb-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col space-y-3">
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <a
                href="https://github.com/flowgent"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <Github className="h-5 w-5 mr-2" />
                Github
              </a>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};
