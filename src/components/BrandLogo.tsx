import Image from "next/image";

/**
 * Persistent Sportradar brand mark. Fixed to the viewport so it stays
 * visible on every screen and phase of the quiz, per brand requirement.
 */
export default function BrandLogo() {
  return (
    <a
      href="https://sportradar.com"
      target="_blank"
      rel="noreferrer"
      aria-label="Powered by Sportradar — opens in a new tab"
      className="brand-badge focus-ring fixed bottom-4 left-4 z-50 overflow-hidden rounded-2xl sm:bottom-6 sm:left-6"
    >
      <Image
        src="/sportradar-logo.png"
        alt="Sportradar — Sports Technology. Reimagined."
        width={756}
        height={406}
        priority
        className="h-11 w-auto sm:h-14"
      />
    </a>
  );
}
