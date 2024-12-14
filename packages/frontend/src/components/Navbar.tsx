import { Button } from './ui/button';
import { MenuIcon } from './MenuIcon';
import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(() => window.innerWidth >= 1024);
  const handleClose = () => setIsMenuOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(true);
      } else {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <nav className="border-b bg-background fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex h-16 items-center px-4 sm:px-6">
            {/* Left side: Menu button and Logo */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                <MenuIcon isOpen={isMenuOpen} />
              </Button>
              <a href="/" className="font-semibold text-xl">
                Flowgent
              </a>
            </div>

            <div className="flex-1 flex justify-end">
            </div>
          </div>
        </div>
      </nav>
      <Sidebar isOpen={isMenuOpen} onClose={handleClose} />
      {/* Remove dynamic padding */}
      <div className="h-16" />
    </>
  );
};
