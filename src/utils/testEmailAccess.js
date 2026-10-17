export function consumeTestEmailFeature(user, setUser, key) {
  if (!user?.testEmailAccess?.active || typeof setUser !== "function") return;
  if (user.testEmailAccess[key] === 0) return;
  setUser({
    ...user,
    testEmailAccess: {
      ...user.testEmailAccess,
      [key]: 0,
    },
  });
}

export function formatTestEmailExpiry(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
