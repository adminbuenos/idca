import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#071a2d]">

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#071a2d]/10 bg-[#f8f6f1]">
        <div className="absolute right-[-120px] top-[-140px] h-[420px] w-[420px] rounded-full border-[70px] border-[#e86f21]/10" />
        <div className="absolute bottom-[-180px] left-[-100px] h-[400px] w-[400px] rounded-full border-[50px] border-[#071a2d]/5" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <Link
            href="/"
            className="text-sm font-medium text-[#526274] transition hover:text-[#e86f21]"
          >
            ← Back to Home
          </Link>

          <div className="mt-16 grid items-center gap-12 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e86f21]/30 bg-white px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-[#e86f21]" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e86f21]">
                  About IDCA
                </span>
              </div>

              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Cricket at the
                <br />
                <span className="text-[#e86f21]">heart of Indore.</span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#526274]">
                The Indore Division Cricket Association is the cricket
                administration body serving the Indore Division and is
                affiliated with the Madhya Pradesh Cricket Association.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/about/office-bearers"
                  className="rounded-full bg-[#e86f21] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#cf5e16]"
                >
                  Meet the Office Bearers →
                </Link>

                <Link
                  href="/tournaments"
                  className="rounded-full border border-[#071a2d]/20 bg-white px-6 py-3 text-sm font-bold text-[#071a2d] transition hover:border-[#e86f21] hover:text-[#e86f21]"
                >
                  Explore Tournaments
                </Link>
              </div>
            </div>

            {/* Sporting visual */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -right-5 -top-5 h-full w-full rounded-[2rem] border-2 border-[#e86f21]/30" />

              <div className="relative overflow-hidden rounded-[2rem] bg-[#071a2d] p-3 shadow-2xl">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
                  <Image
                    src="/images/idca-team.jpg"
                    alt="IDCA cricket team"
                    fill
                    className="object-cover"
                    priority
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#071a2d]/80 via-transparent to-transparent" />

                  <div className="absolute bottom-7 left-7">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#ff9b5b]">
                      IDCA
                    </p>

                    <p className="mt-2 text-2xl font-black text-white">
                      More than a game.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* IDCA INTRO */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e86f21]">
                The Association
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Building the game in Indore.
              </h2>
            </div>

            <div className="space-y-6 text-lg leading-8 text-[#526274]">
              <p>
                The Indore Division Cricket Association (IDCA) brings together
                the cricketing community of the Indore Division through an
                organized structure of clubs, players, competitions and
                cricket administration.
              </p>

              <p>
                The association conducts and supports cricket activities
                across different competitions and age groups while providing
                clubs and players with a structured platform to participate
                and compete.
              </p>

              <p>
                IDCA operates under the affiliation of the Madhya Pradesh
                Cricket Association (MPCA).
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* WHAT WE DO */}
      <section className="bg-[#f1eee7]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e86f21]">
                The IDCA Platform
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Everything cricket,
                <br />
                in one place.
              </h2>
            </div>

            <p className="max-w-md text-base leading-7 text-[#526274]">
              The association connects clubs, players, competitions and
              cricket information across the Indore Division.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              number="01"
              title="Clubs"
              description="Affiliated clubs participating across the IDCA cricket structure."
            />

            <FeatureCard
              number="02"
              title="Players"
              description="A structured environment for players participating in division cricket."
            />

            <FeatureCard
              number="03"
              title="Tournaments"
              description="Competitions across different formats and age categories."
            />

            <FeatureCard
              number="04"
              title="Fixtures & Results"
              description="Match schedules, results and cricket information."
            />
          </div>
        </div>
      </section>


      {/* LEADERSHIP */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e86f21]">
                Leadership
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                The people behind IDCA.
              </h2>
            </div>

            <Link
              href="/about/office-bearers"
              className="font-bold text-[#e86f21] transition hover:text-[#071a2d]"
            >
              View all office bearers →
            </Link>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <LeadershipCard
              number="01"
              designation="President"
              name="Hon. Shri Akash Vijayvargiya Ji"
            />

            <LeadershipCard
              number="02"
              designation="Chairman"
              name="Shri Sanjay Lunawat Ji"
            />

            <LeadershipCard
              number="03"
              designation="Secretary"
              name="Shri Devashish Nilosey Ji"
            />
          </div>
        </div>
      </section>


      {/* LOCATION */}
      <section className="relative overflow-hidden bg-[#071a2d] text-white">
        <div className="absolute right-[-150px] top-[-150px] h-[450px] w-[450px] rounded-full border-[70px] border-[#e86f21]/10" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#ff9b5b]">
                Visit IDCA
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Find us in Indore.
              </h2>

              <p className="mt-6 text-lg leading-8 text-white/65">
                Indore Division Cricket Association
              </p>

              <div className="mt-7 text-base leading-7 text-white/85">
                PV5M+H9W
                <br />
                White Church Colony
                <br />
                Residency Area
                <br />
                Indore, Madhya Pradesh 452001
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=PV5M%2BH9W%2C%20White%20Church%20Colony%2C%20Residency%20Area%2C%20Indore%2C%20Madhya%20Pradesh%20452001"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex rounded-full bg-[#e86f21] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#cf5e16]"
              >
                Open in Google Maps ↗
              </a>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white">
              <iframe
                title="IDCA location"
                src="https://www.google.com/maps?q=PV5M%2BH9W%2C%20White%20Church%20Colony%2C%20Residency%20Area%2C%20Indore%2C%20Madhya%20Pradesh%20452001&output=embed"
                className="h-[380px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

          </div>
        </div>
      </section>


      {/* FINAL CTA */}
      <section className="bg-[#f8f6f1]">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e86f21]">
            Indore Division Cricket Association
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
            Follow the game. Follow IDCA.
          </h2>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/tournaments"
              className="rounded-full bg-[#e86f21] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#cf5e16]"
            >
              Explore Tournaments
            </Link>

            <Link
              href="/clubs"
              className="rounded-full border border-[#071a2d]/20 bg-white px-6 py-3 text-sm font-bold text-[#071a2d] transition hover:border-[#e86f21]"
            >
              Explore Clubs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}


function FeatureCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#071a2d]/10 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-[#e86f21]/40 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#9aa4af]">
          {number}
        </span>

        <span className="text-xl text-[#e86f21] transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>

      <h3 className="mt-14 text-xl font-black">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-[#526274]">
        {description}
      </p>
    </div>
  );
}


function LeadershipCard({
  number,
  designation,
  name,
}: {
  number: string;
  designation: string;
  name: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#071a2d]/10 bg-[#f8f6f1] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#e86f21]/40 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#9aa4af]">
          {number}
        </span>

        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#e86f21]">
          {designation}
        </span>
      </div>

      <div className="mt-16">
        <h3 className="text-xl font-black leading-7">
          {name}
        </h3>

        <p className="mt-2 text-sm text-[#526274]">
          Indore Division Cricket Association
        </p>
      </div>

      <div className="mt-7 h-1 w-8 rounded-full bg-[#e86f21] transition-all duration-300 group-hover:w-16" />
    </div>
  );
}