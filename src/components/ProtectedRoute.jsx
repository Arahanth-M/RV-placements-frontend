import { FaComments, FaExternalLinkAlt } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { BETA_JOIN_FORM_URL } from '../utils/constants';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (user.isAdminSession !== true && user.isBetaListed !== true) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4 py-10">
        <div className="max-w-xl w-full bg-theme-card border border-theme rounded-2xl p-6 sm:p-8 text-center shadow-lg">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-theme-accent/40 bg-theme-hero px-3 py-1.5 mx-auto">
            <FaComments className="text-theme-accent" />
            <span className="text-xs font-semibold uppercase tracking-wide text-theme-accent">
              Beta access
            </span>
          </div>
          <h2 className="text-2xl font-bold text-theme-primary mb-4">
            Access restricted to beta users
          </h2>
          <p className="text-theme-secondary text-sm sm:text-base leading-relaxed">
            This section is currently available only for users included in the beta test. If you are part of 2026 Computer Science, you can request access using the form below.
          </p>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-theme-secondary">
            If you are from another branch, please wait — we are extending to your branch as well. Right now access is only for CS.
          </p>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-theme-secondary">
            {`A beta test is going on for the '22 batch; other batches can start using the platform very shortly.`}
          </p>
          <div className="mt-6 rounded-xl border border-theme bg-theme-hero p-4 sm:p-5 text-left">
            <p className="text-sm text-theme-secondary sm:text-base">
              Request beta access by filling out the short Google Form (opens in a new tab).
            </p>
            <a
              href={BETA_JOIN_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-theme-accent/40 bg-theme-hero px-4 py-2.5 text-sm font-semibold text-theme-accent shadow-sm transition-opacity hover:opacity-90 shadow-lg"
            >
              Open beta signup form
              <FaExternalLinkAlt className="h-3.5 w-3.5" />
            </a>
            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-theme-secondary">
              After submitting the form, wait a few seconds and then log out and sign in again to activate your beta access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;