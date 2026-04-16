import { createContext, useContext, useMemo, useState } from "react";

const InterviewLockContext = createContext(null);

export function InterviewLockProvider({ children }) {
  const [isInterviewLocked, setIsInterviewLocked] = useState(false);

  const value = useMemo(
    () => ({
      isInterviewLocked,
      setIsInterviewLocked,
    }),
    [isInterviewLocked]
  );

  return (
    <InterviewLockContext.Provider value={value}>
      {children}
    </InterviewLockContext.Provider>
  );
}

export function useInterviewLock() {
  const context = useContext(InterviewLockContext);
  if (!context) {
    throw new Error("useInterviewLock must be used within an InterviewLockProvider");
  }
  return context;
}
