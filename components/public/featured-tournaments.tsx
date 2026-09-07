import Link from "next/link";

const tournaments = [
  {
    category: "JUNIOR CRICKET",
    title: "Under 13",
    description:
      "Developing the next generation of cricketers through structured competitive cricket.",
    href: "/tournaments?category=u13",
  },
  {
    category: "JUNIOR CRICKET",
    title: "Under 15",
    description:
      "Competitive cricket designed to develop skills, discipline and match experience.",
    href: "/tournaments?category=u15",
  },
  {
    category: "JUNIOR CRICKET",
    title: "Under 18",
    description:
      "A pathway for young cricketers progressing towards senior-level competition.",
    href: "/tournaments?category=u18",
  },
  {
    category: "SENIOR CRICKET",
    title: "Senior",
    description:
      "The highest level of divisional club cricket across the IDCA competition structure.",
    href: "/tournaments?category=senior",
  },
];

export default function FeaturedTournaments() {
  return (
    <section className="bg-gray-950 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              2026–27 Season
            </p>

            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Cricket for every stage
              <br className="hidden sm:block" />
              of the journey.
            </h2>
          </div>

          <Link
            href="/tournaments"
            className="inline-flex w-fit items-center text-sm font-semibold text-white transition hover:translate-x-1"
          >
            View all tournaments
            <span className="ml-2">→</span>
          </Link>
        </div>

        {/* Tournament Cards */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
          {tournaments.map((tournament, index) => (
            <Link
              key={tournament.title}
              href={tournament.href}
              className="group relative min-h-[330px] bg-gray-950 p-7 transition duration-300 hover:bg-white/[0.06]"
            >
              {/* Number */}
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold tracking-[0.15em] text-white/30">
                  0{index + 1}
                </span>

                <span className="text-xl text-white/30 transition group-hover:translate-x-1 group-hover:text-white">
                  →
                </span>
              </div>

              {/* Content */}
              <div className="absolute bottom-7 left-7 right-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  {tournament.category}
                </p>

                <h3 className="mt-3 text-2xl font-bold text-white">
                  {tournament.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/50">
                  {tournament.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Season note */}
        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs uppercase tracking-[0.15em] text-white/30">
            Official IDCA competition structure
          </p>

          <p className="text-sm text-white/40">
            More competitions will be published throughout the season.
          </p>
        </div>
      </div>
    </section>
  );
}