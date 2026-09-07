import Link from "next/link";

const updates = [
  {
    date: "05 SEP 2026",
    type: "IDCA NOTICE",
    title: "Important announcements and information for affiliated clubs",
    href: "/notices",
  },
  {
    date: "03 SEP 2026",
    type: "TOURNAMENT",
    title: "2026–27 cricket season information",
    href: "/tournaments",
  },
  {
    date: "01 SEP 2026",
    type: "GENERAL",
    title: "Registration and association information",
    href: "/notices",
  },
];

export default function LatestUpdates() {
  return (
    <section className="bg-white px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          {/* Section Introduction */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Latest Updates
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              Stay connected
              <br />
              with IDCA.
            </h2>

            <p className="mt-5 max-w-md text-base leading-7 text-gray-600">
              Keep up with the latest announcements, tournament
              information and important updates from the Indore
              Division Cricket Association.
            </p>

            <Link
              href="/notices"
              className="mt-7 inline-flex items-center text-sm font-semibold text-gray-950 transition hover:translate-x-1"
            >
              View all notices
              <span className="ml-2">→</span>
            </Link>
          </div>

          {/* Updates */}
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {updates.map((update) => (
              <Link
                key={`${update.date}-${update.title}`}
                href={update.href}
                className="group block py-6 transition first:pt-6 last:pb-6"
              >
                <div className="grid gap-4 sm:grid-cols-[130px_1fr_auto] sm:items-center">
                  {/* Date */}
                  <p className="text-xs font-semibold tracking-wide text-gray-400">
                    {update.date}
                  </p>

                  {/* Content */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      {update.type}
                    </p>

                    <h3 className="mt-2 text-base font-semibold leading-6 text-gray-950 transition group-hover:text-gray-600 sm:text-lg">
                      {update.title}
                    </h3>
                  </div>

                  {/* Arrow */}
                  <span className="hidden text-xl text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-950 sm:block">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}