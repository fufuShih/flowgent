import { Button } from './ui/button';
import { MenuIcon } from './MenuIcon';
import { useState } from 'react';
import { Sidebar } from './Sidebar';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleClose = () => setIsMenuOpen(false);

  return (
    <nav className="border-b bg-background fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex h-16 items-center px-4 sm:px-6">
          {/* Left side: Menu button and Logo */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden"
              aria-label="Toggle menu"
            >
              <MenuIcon isOpen={isMenuOpen} />
            </Button>
            <a href="/" className="font-semibold text-xl">
              Flowgent
            </a>
          </div>

          {/* Right side: can be used for other elements */}
          <div className="flex-1 flex justify-end">
          </div>
        </div>
      </div>
      <Sidebar isOpen={isMenuOpen} onClose={handleClose} />
    </nav>
  );
};
