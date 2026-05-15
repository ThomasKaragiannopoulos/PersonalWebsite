import Link from "next/link";
import { NeuralCloudWrapper } from "@/components/NeuralCloudWrapper";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Sandbox — full screen */}
      <section id="sandbox" className="relative h-screen w-full overflow-hidden bg-black">
        <NeuralCloudWrapper />
      </section>


      {/* Web Design */}
      <section
        id="web-design"
        className="flex min-h-screen flex-col justify-center border-t border-white/8 px-6 sm:px-8 lg:px-12"
      >
        <div className="mx-auto w-full max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Web Design
          </p>
          <h2 className="font-display mt-6 max-w-3xl text-5xl font-normal text-white sm:text-7xl">
            Fast, modern sites built to convert.
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-7 text-[var(--muted)]">
            From landing pages to full products — designed and shipped with an obsessive eye for detail.
          </p>
          <div className="mt-10">
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-[var(--muted)] transition-colors hover:border-white/25 hover:text-white"
            >
              View work →
            </Link>
          </div>
        </div>
      </section>

      {/* AI Systems */}
      <section
        id="ai-systems"
        className="flex min-h-screen flex-col justify-center border-t border-white/8 px-6 sm:px-8 lg:px-12"
      >
        <div className="mx-auto w-full max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            AI Systems
          </p>
          <h2 className="font-display mt-6 max-w-3xl text-5xl font-normal text-white sm:text-7xl">
            Not demos — production systems.
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-7 text-[var(--muted)]">
            Custom AI pipelines, agents, and integrations built for real business problems.
          </p>
          <div className="mt-10">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-[var(--muted)] transition-colors hover:border-white/25 hover:text-white"
            >
              View work →
            </Link>
          </div>
        </div>
      </section>

      {/* Automations */}
      <section
        id="automations"
        className="flex min-h-screen flex-col justify-center border-t border-white/8 px-6 sm:px-8 lg:px-12"
      >
        <div className="mx-auto w-full max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Automations
          </p>
          <h2 className="font-display mt-6 max-w-3xl text-5xl font-normal text-white sm:text-7xl">
            Should have been automated yesterday.
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-7 text-[var(--muted)]">
            Workflows, triggers, data pipelines — quietly running in the background so you don&apos;t have to.
          </p>
          <div className="mt-10">
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-[var(--muted)] transition-colors hover:border-white/25 hover:text-white"
            >
              View work →
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Contact
          </p>
          <h2 className="font-display mt-4 text-4xl font-normal text-white sm:text-5xl">
            Let&apos;s talk
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Got a project in mind? We&apos;d love to hear it.{" "}
            <a
              href="mailto:thomas@karagiannopoulos.dev"
              className="text-white underline-offset-4 hover:underline"
            >
              Or email directly.
            </a>
          </p>

          <form className="mt-10 space-y-4" action="#" method="POST">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">Name</span>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent)]/40"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent)]/40"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--muted)]">Message</span>
              <textarea
                name="message"
                rows={6}
                required
                className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent)]/40"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Send message
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
