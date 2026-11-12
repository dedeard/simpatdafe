const COVER = {
  src: '/images/raja-ampat.jpg',
  alt: 'Karst islands in turquoise water at Piaynemo, Raja Ampat',
  author: 'Nickoasmara',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Majestic_Raja_Ampat.jpg',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
}

export function AuthCover() {
  return (
    <div data-slot="auth-cover" className="relative hidden bg-muted lg:block">
      <img src={COVER.src} alt={COVER.alt} className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.6]" />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-10 text-white">
        <blockquote className="flex max-w-md flex-col gap-2">
          <p className="text-lg font-medium text-balance">Everything your team needs, in one place.</p>
          <footer className="text-sm text-white/70">simpatdafe</footer>
        </blockquote>
        <p className="text-xs text-white/60">
          Photo:{' '}
          <a href={COVER.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            Raja Ampat
          </a>{' '}
          by {COVER.author},{' '}
          <a href={COVER.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {COVER.license}
          </a>
        </p>
      </div>
    </div>
  )
}
