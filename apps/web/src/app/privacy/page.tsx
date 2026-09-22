import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy — BelieveMeGuys' };

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl py-4">
      <div className="text-center">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">Legal</div>
        <h1 className="text-[2.6rem] leading-[1.02] text-fg sm:text-[3.25rem]" style={{ letterSpacing: '-0.035em', fontWeight: 600 }}>
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted">Last updated: 20 September 2026</p>

      </div>

      <div className="card-surface mt-10 space-y-8 p-6 text-sm leading-relaxed text-muted sm:p-10">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg" style={{ letterSpacing: '-0.01em' }}>1. What we collect</h2>
          <p className="mt-2">
            Account details you provide (name, email, country, city, postal code, optional phone, and your
            leader/follower intent); your exchange API keys, which are encrypted at rest with AES-256-GCM and used
            only to read balances and place the trades you opt into; and product-usage data (pages visited, session
            duration, coarse feature usage, device user-agent) to understand and improve the product.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg" style={{ letterSpacing: '-0.01em' }}>2. How your location is used</h2>
          <p className="mt-2">
            To show an aggregate view of where our users are based, we convert your city, postal code, and country to
            approximate map coordinates using the OpenStreetMap Nominatim geocoding service. This means that location
            text is sent to that third-party service for lookup. We store only the resulting coordinates and your
            entered location.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg" style={{ letterSpacing: '-0.01em' }}>3. Third parties</h2>
          <p className="mt-2">
            We share data only as needed to run the service: your exchange (Delta Exchange India) to place trades;
            our email provider (Resend) to send verification and account emails; OpenStreetMap for geocoding; and our
            hosting/database/cache providers. We do not sell your personal data.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg" style={{ letterSpacing: '-0.01em' }}>4. Retention & security</h2>
          <p className="mt-2">
            Product-usage records are periodically pruned. API secrets are encrypted at rest and never displayed
            again after you connect an account. We take reasonable measures to protect your data but no system is
            perfectly secure.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg" style={{ letterSpacing: '-0.01em' }}>5. Your choices & contact</h2>
          <p className="mt-2">
            You can disconnect exchange accounts, stop copying, and request deletion of your account by contacting
            privacy@believemeguys.com.
          </p>
        </section>
      </div>
    </div>
  );
}
