import { LegalPage } from "../_components/LegalPage";

export const metadata = { title: "Privacy Policy — Ahia" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updatedAt="2026-05-26">
      <section className="flex flex-col gap-2">
        <h2>1. What we collect</h2>
        <ul>
          <li>Account info — name, email, phone, password (hashed).</li>
          <li>Profile info you provide — avatar, shop description, location.</li>
          <li>Listings, messages, transactions, and dispute records.</li>
          <li>
            Device info and engagement signals (impressions, clicks) used to
            rank the feed and Discover.
          </li>
          <li>Payment metadata from Paystack — never your card details.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2>2. How we use it</h2>
        <ul>
          <li>Run the marketplace — match buyers to sellers, process orders.</li>
          <li>Hold escrow safely and release funds correctly.</li>
          <li>Improve ranking, recommendations, and trust scores.</li>
          <li>
            Investigate disputes — chat history is only read when a formal
            dispute is opened for that specific transaction.
          </li>
          <li>Send transactional emails (Resend) and notifications.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2>3. Who we share with</h2>
        <ul>
          <li>Paystack (payment processing).</li>
          <li>Cloudinary (image and video hosting).</li>
          <li>Resend (transactional email delivery).</li>
          <li>
            Law enforcement only when compelled by valid Nigerian legal process.
          </li>
        </ul>
        <p>
          We do not sell your personal data. We do not share your chat
          contents with third-party advertisers.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>4. Cookies and local storage</h2>
        <p>
          We use minimal local storage for theme preference, your wishlist, and
          session tokens. We do not embed third-party tracking cookies.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>5. Your rights</h2>
        <p>
          You can view, edit, or delete your account at any time from your
          Profile page. Email{" "}
          <a
            href="mailto:hello@ahia.ng"
            className="font-medium text-primary hover:underline"
          >
            hello@ahia.ng
          </a>{" "}
          for data export or full account deletion.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>6. Children</h2>
        <p>
          Ahia is not directed at children under 18. We do not knowingly
          collect personal data from minors.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>7. Security</h2>
        <p>
          Passwords are hashed. Tokens are stored in httpOnly cookies and never
          exposed to JavaScript. Cardholder data is never stored on Ahia
          servers.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>8. Changes</h2>
        <p>
          We will notify you in-app of any material change to how we collect or
          use personal data.
        </p>
      </section>
    </LegalPage>
  );
}
