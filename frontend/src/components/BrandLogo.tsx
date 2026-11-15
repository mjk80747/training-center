type BrandLogoProps = {
  alt?: string;
  className?: string;
};

export function BrandLogo({
  alt = 'KSR IT SOLUTIONS',
  className = '',
}: BrandLogoProps) {
  return (
    <span className={`brand-lockup ${className}`}>
      <img className="brand-lockup-mark" src="/ksr-it-solutions-mark.png" alt="" />
      <span className="brand-lockup-copy">
        <strong>{alt}</strong>
        <small>TRAIN · BUILD · PLACE</small>
      </span>
    </span>
  );
}
