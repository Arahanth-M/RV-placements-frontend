import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CompanyLogo from "./CompanyLogo";

/**
 * AnimatedLogoGrid Component
 * Displays a grid of company logos that randomly swap out with others from a pool.
 * 
 * @param {Array} companies - Full pool of company objects.
 * @param {number} gridSize - Number of logos to show at once.
 * @param {number} interval - Time in ms between swaps.
 */
const AnimatedLogoGrid = ({ companies, gridSize = 5, interval = 3000 }) => {
  // If pool is smaller than grid, just show all static
  const isSmallPool = companies.length <= gridSize;
  
  // displayedCompanies keeps track of which companies are in which grid slot
  const [displayedCompanies, setDisplayedCompanies] = useState([]);

  // Initialize/Update displayed companies when pool data arrives
  useEffect(() => {
    if (companies.length > 0) {
      // If we don't have enough logos displayed but have more available, re-initialize
      // or if we have 0 logos but companies exist
      if (displayedCompanies.length < Math.min(gridSize, companies.length)) {
        const indices = Array.from({ length: companies.length }, (_, i) => i);
        const shuffled = [...indices].sort(() => Math.random() - 0.5);
        const slice = shuffled.slice(0, Math.min(gridSize, companies.length));
        setDisplayedCompanies(slice.map(idx => companies[idx]));
      }
    }
  }, [companies, gridSize, displayedCompanies.length]);

  useEffect(() => {
    if (isSmallPool || companies.length === 0 || displayedCompanies.length === 0) return;

    const timer = setInterval(() => {
      setDisplayedCompanies(prev => {
        if (prev.length === 0) return prev;
        
        const next = [...prev];
        // Pick a random slot to replace
        const slotToReplace = Math.floor(Math.random() * next.length);
        
        // Find companies not currently displayed
        const currentlyDisplayedIds = new Set(next.map(c => c?._id || c?.name));
        const availablePool = companies.filter(c => !currentlyDisplayedIds.has(c?._id || c?.name));
        
        if (availablePool.length > 0) {
          const newCompany = availablePool[Math.floor(Math.random() * availablePool.length)];
          next[slotToReplace] = newCompany;
        }
        
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [companies, gridSize, interval, isSmallPool, displayedCompanies.length]);

  if (companies.length === 0) {
    return <p className="text-theme-muted text-sm italic">No logos available</p>;
  }

  // Keep logo tiles inside narrow mobile cards:
  // use fewer columns on mobile, then expand on larger breakpoints.
  const gridClassName =
    displayedCompanies.length >= 5
      ? "grid-cols-3 sm:grid-cols-5"
      : displayedCompanies.length >= 3
        ? "grid-cols-3"
        : displayedCompanies.length === 2
          ? "grid-cols-2"
          : "grid-cols-1";

  return (
    <div className={`grid ${gridClassName} gap-1.5 sm:gap-2 p-1.5 sm:p-2 w-full mx-auto min-h-[72px] sm:min-h-[80px] items-center justify-center overflow-hidden`}>
      {displayedCompanies.map((company, index) => (
        <div key={index} className="relative w-10 h-10 sm:w-20 sm:h-20 mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={company?._id || company?.name || index}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              whileHover={{ 
                scale: 1.15, 
                rotate: 2,
                zIndex: 10,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)"
              }}
              transition={{ 
                duration: 0.4,
                scale: { type: "spring", stiffness: 300, damping: 15 }
              }}
              className="w-10 h-10 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl border border-theme sm:border-2 bg-theme-input flex items-center justify-center overflow-hidden shadow-sm transition-all cursor-pointer"
            >
              <CompanyLogo
                company={company}
                className="w-8 h-8 sm:w-16 sm:h-16 object-contain p-0.5 sm:p-1"
                alt={`${company?.name || 'Company'} logo`}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default AnimatedLogoGrid;
