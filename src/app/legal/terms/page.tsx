import { LegalPage } from "../_components/LegalPage";

export const metadata = { title: "Terms of Service — Ahia" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updatedAt="2026-05-26">
      <section className="flex flex-col gap-2">
        <h2>1. Who we are</h2>
        <p>
          Ahia is a Nigerian online marketplace that connects buyers and
          sellers. We operate the platform; we do not own the goods or set
          prices. Sellers list, buyers buy, and we hold payment in escrow until
          delivery is confirmed.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>2. Your account</h2>
        <p>
          To buy or sell, you must be at least 18 years old (or have a
          guardian&apos;s consent) and provide accurate contact information. You
          are responsible for activity under your account.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>3. Payments and escrow</h2>
        <ul>
          <li>Buyers pay through Ahia. Off-platform payment is not protected.</li>
          <li>Funds sit in escrow until the buyer confirms delivery.</li>
          <li>
            Ahia takes a platform fee on every completed transaction (currently
            5% of order value, subject to change with notice).
          </li>
          <li>
            If the buyer does not confirm or dispute within 7 days of delivery,
            funds release automatically to the seller.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2>4. Disputes and refunds</h2>
        <p>
          Buyers can raise a dispute within the confirmation window. Our team
          reviews the chat history and any evidence provided, then decides
          whether to refund the buyer or release funds to the seller. Decisions
          are final unless new evidence is presented within 7 days.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>5. Prohibited items</h2>
        <p>
          You may not list or buy: counterfeit goods, weapons, regulated drugs,
          live animals, services posing as products, stolen items, or anything
          illegal under Nigerian law. We reserve the right to remove listings
          and suspend accounts without notice.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>6. Chat conduct</h2>
        <p>
          Treat each other with respect. Harassment, hate speech, scams, and
          requests for off-platform payment are grounds for account suspension.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>7. Boosts and ads</h2>
        <p>
          Sellers can pay to promote products in the feed or videos in
          Discover. Boost placements do not bypass our trust safeguards. We do
          not guarantee a specific number of impressions or sales.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>8. Liability</h2>
        <p>
          Ahia provides the platform &quot;as is.&quot; We are not liable for
          the quality, accuracy, or legality of items listed by sellers, except
          as covered by our escrow and dispute policies.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>9. Changes</h2>
        <p>
          We may update these terms. Material changes will be announced in-app
          and via email. Continued use after a change means you accept the new
          terms.
        </p>
      </section>
    </LegalPage>
  );
}
