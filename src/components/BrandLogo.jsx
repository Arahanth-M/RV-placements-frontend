import logo from "../assets/logo.webp";

export default function BrandLogo({
  className = "",
  alt = "RV College logo",
  ...props
}) {
  return (
    <div
      className={`rv-brand-logo-wrap flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden ${className}`.trim()}
    >
      <img
        src={logo}
        alt={alt}
        className="rv-brand-logo max-h-full max-w-full object-contain"
        {...props}
      />
    </div>
  );
}
