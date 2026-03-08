import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-bebas text-[80px] leading-none text-rouge-cinema">404</h1>
      <p className="mt-4 font-playfair text-title text-noir-velours">
        Page introuvable
      </p>
      <p className="mt-2 font-crimson text-body text-sepia-chaud">
        La page que vous cherchez n&apos;existe pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded bg-rouge-cinema px-6 py-2 font-crimson text-body text-creme-ecran transition-colors hover:bg-bordeaux-profond"
      >
        Retour &agrave; l&apos;accueil
      </Link>
    </div>
  );
}
