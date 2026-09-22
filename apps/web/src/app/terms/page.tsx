import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service — BelieveMeGuys' };

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl py-4">
      <div className="text-center">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">Legal</div>
        <h1 className="text-[2.6rem] leading-[1.02] text-fg sm:text-[3.25rem]" style={{ letterSpacing: '-0.035em', fontWeight: 600 }}>
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-muted">Last updated: 20 September 2026</p>

      </div>

      <div className="card-surface mt-10 space-y-8 p-6 text-sm leading-relaxed text-muted sm:p-10">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg" style={{ letterSpacing: '-0.01em' }}>1. What BelieveMeGuys is</h2>
          <p className="mt-2">
            BelieveMeGuys is a non-custodial copy-trading tool. You connect your own exchange account using
            trade-only API keys, and the platform mirrors trades from a leader you choose into your account by
            placing orders through your keys. We never take custody of your funds and cannot withdraw them.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg" style={{ letterSpacing: '-0.01em' }}>2. Risk disclosure</h2>
          <p className="mt-2">
            Trading crypto derivatives involves substantial risk of loss and is not suitable for everyone. Copying
            another trader does not reduce that risk. Past performance of any leader is not indicative of future
            results. You may lose some or all of your capital. You are solely responsible for the trades placed in
            your account and for the sizing, limits, and leaders you select. Nothing on this platform is investment,
            financial, legal, or tax advice.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg" style={{ letterSpacing: '-0.01em' }}>3. Your responsibilities</h2>
          <p className="mt-2">
            You must be legally permitted to trade in your jurisdiction, provide accurate information, keep your
            credentials secure, and use trade-only API keys with withdrawals disabled. You are responsible for any
            fees, funding, and margin requirements on your exchange.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg" style={{ letterSpacing: '-0.01em' }}>4. Availability & changes</h2>
          <p className="mt-2">
            The service is provided “as is,” without warranties. We may pause copying (including via a platform-wide
            kill-switch), verify or delist leaders, and change or discontinue features at any time. We are not liable
            for exchange downtime, network issues, missed or delayed trades, or losses arising from use of the
            service, to the maximum extent permitted by law.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-fg" style={{ letterSpacing: '-0.01em' }}>5. Contact</h2>
          <p className="mt-2">Questions about these terms: support@believemeguys.com.</p>
        </section>
      </div>
    </div>
  );
}
