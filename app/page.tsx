import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-[#102746]">

      {/* ========================================================= */}
      {/* HEADER                                                    */}
      {/* ========================================================= */}

      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-[88px] max-w-[1280px] items-center justify-between px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-[62px] w-[62px] shrink-0">
              <Image
                src="/images/idca/logo.jpg"
                alt="Indore Division Cricket Association"
                fill
                priority
                className="object-contain"
              />
            </div>

            <div className="leading-none">
              <p className="text-[17px] font-extrabold tracking-tight text-[#102746]">
                INDORE DIVISION
              </p>

              <p className="mt-1 text-[13px] font-bold tracking-wide text-[#f15a24]">
                CRICKET ASSOCIATION
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 lg:flex">
            <NavLink href="/" active>
              Home
            </NavLink>

            <NavLink href="/tournaments">
              Tournaments
            </NavLink>

            <NavLink href="/clubs">
              Clubs
            </NavLink>

            <NavLink href="/fixtures">
              Fixtures & Results
            </NavLink>

            <NavLink href="/notices">
              Notices
            </NavLink>

            <NavLink href="/about">
              About
            </NavLink>
          </nav>

          {/* Admin Login */}
          <Link
            href="/login"
            className="rounded-lg bg-[#f15a24] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#d94d1d]"
          >
            Admin Login
          </Link>
        </div>
      </header>


      {/* ========================================================= */}
      {/* HERO                                                      */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden bg-[#f8f6f1]">

        <div className="mx-auto grid max-w-[1280px] lg:grid-cols-[0.92fr_1.08fr]">

          {/* Hero copy */}
          <div className="relative flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-12 lg:py-20">

            {/* Decorative cricket silhouette */}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden opacity-[0.045]">
              <div className="absolute -left-10 bottom-[-50px] text-[300px] font-black leading-none">
                🏏
              </div>
            </div>

            <div className="relative z-10">

              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#f15a24]">
                Official IDCA Platform
              </p>

              <h1 className="mt-5 max-w-[650px] text-5xl font-black leading-[0.98] tracking-[-0.04em] text-[#102746] sm:text-6xl lg:text-[68px]">
                Cricket at the
                <span className="block text-[#f15a24]">
                  heart of Indore.
                </span>
              </h1>

              <p className="mt-7 max-w-[590px] text-base leading-7 text-[#596575] sm:text-lg">
                Connecting clubs, players, tournaments, fixtures, results
                and the cricket community of Indore.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">

                <Link
                  href="/tournaments"
                  className="rounded-lg bg-[#f15a24] px-7 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#d94d1d]"
                >
                  Explore Tournaments
                  <span className="ml-2">→</span>
                </Link>

                <Link
                  href="/notices"
                  className="rounded-lg border-2 border-[#f15a24] bg-white px-7 py-4 text-sm font-bold text-[#f15a24] transition hover:bg-orange-50"
                >
                  Latest Notices
                </Link>

              </div>
            </div>
          </div>


          {/* Hero photograph */}
          <div className="relative min-h-[390px] overflow-hidden lg:min-h-[500px]">

            <Image
              src="/images/homepage/champions.jpg"
              alt="IDCA cricket champions"
              fill
              priority
              className="object-cover"
            />

            {/* Orange angled divider */}
            <div className="absolute -left-14 top-[-30px] h-[115%] w-[95px] rotate-[9deg] bg-[#f15a24]" />

            {/* Slight image overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10" />

            {/* Caption */}
            <div className="absolute bottom-7 right-6 max-w-[280px] sm:right-10">

              <div className="bg-[#f15a24] px-6 py-4 text-white shadow-lg">
                <p className="text-lg font-black leading-tight">
                  More Than A Game
                </p>

                <p className="mt-1 text-sm font-semibold italic">
                  A Stronger Indore
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>


      {/* ========================================================= */}
      {/* ASSOCIATION STATS                                         */}
      {/* ========================================================= */}

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 sm:grid-cols-4">

          <Stat
            icon="🏆"
            value="IDCA"
            label="INDORE DIVISION"
          />

          <Stat
            icon="👥"
            value="MPCA"
            label="AFFILIATED ASSOCIATION"
          />

          <Stat
            icon="▣"
            value="2026–27"
            label="CURRENT SEASON"
          />

          <Stat
            icon="∞"
            value="∞"
            label="THE GAME CONTINUES"
          />

        </div>
      </section>


      {/* ========================================================= */}
      {/* QUICK ACCESS                                              */}
      {/* ========================================================= */}

      <section className="bg-white px-6 py-16 sm:px-8 lg:px-10 lg:py-20">

        <div className="mx-auto max-w-[1280px]">

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#f15a24]">
                Follow The Game
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.03em] text-[#102746] sm:text-5xl">
                Everything cricket, in one place.
              </h2>
            </div>

            <p className="max-w-[470px] text-base leading-7 text-[#667085]">
              Explore the latest competitions, clubs, fixtures, results
              and official information from IDCA.
            </p>

          </div>


          <div className="mt-12 grid gap-5 md:grid-cols-3">

            <FeatureCard
              number="01"
              title="Tournaments"
              description="Follow IDCA competitions, age groups and the current cricket season."
              href="/tournaments"
            />

            <FeatureCard
              number="02"
              title="Clubs"
              description="Explore registered clubs across the IDCA competition structure."
              href="/clubs"
            />

            <FeatureCard
              number="03"
              title="Fixtures & Results"
              description="Fixtures, match results and cricket information will be available here."
              href="/fixtures"
            />

          </div>

        </div>
      </section>


      {/* ========================================================= */}
      {/* IDCA IDENTITY                                             */}
      {/* ========================================================= */}

      <section className="border-t border-gray-100 bg-[#f8f6f1] px-6 py-16 sm:px-8 lg:px-10 lg:py-20">

        <div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-[280px_1fr]">

          <div className="flex justify-center lg:justify-start">
            <div className="relative h-52 w-52 rounded-full bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <Image
                src="/images/idca/logo.jpg"
                alt="IDCA logo"
                fill
                className="object-contain p-6"
              />
            </div>
          </div>

          <div>

            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#f15a24]">
              Indore Division Cricket Association
            </p>

            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.03em] text-[#102746] sm:text-4xl">
              Building a stronger cricketing ecosystem in Indore.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[#667085]">
              From grassroots and age-group cricket to senior competitions,
              IDCA works to organise, develop and promote cricket across
              the Indore Division.
            </p>

            <Link
              href="/about"
              className="mt-7 inline-flex items-center text-sm font-extrabold text-[#f15a24] hover:text-[#d94d1d]"
            >
              Learn more about IDCA
              <span className="ml-2">→</span>
            </Link>

          </div>

        </div>
      </section>

    </main>
  );
}


/* =============================================================== */
/* NAV LINK                                                        */
/* =============================================================== */

function NavLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative py-8 text-sm font-semibold transition ${
        active
          ? "text-[#f15a24]"
          : "text-[#102746] hover:text-[#f15a24]"
      }`}
    >
      {children}

      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#f15a24]" />
      )}
    </Link>
  );
}


/* =============================================================== */
/* STAT                                                            */
/* =============================================================== */

function Stat({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 border-r border-gray-200 px-5 py-7 last:border-r-0 sm:px-8">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center text-2xl text-[#f15a24]">
        {icon}
      </div>

      <div>
        <p className="text-xl font-black tracking-tight text-[#102746]">
          {value}
        </p>

        <p className="mt-1 text-[10px] font-bold tracking-[0.12em] text-gray-400 sm:text-xs">
          {label}
        </p>
      </div>

    </div>
  );
}


/* =============================================================== */
/* FEATURE CARD                                                    */
/* =============================================================== */

function FeatureCard({
  number,
  title,
  description,
  href,
}: {
  number: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative min-h-[250px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
    >

      <div className="flex items-start justify-between">

        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-xs font-black text-[#f15a24]">
          {number}
        </span>

        <span className="text-2xl font-light text-[#f15a24] transition group-hover:translate-x-1">
          →
        </span>

      </div>

      <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#f15a24] transition-all duration-300 group-hover:w-full" />

      <h3 className="mt-12 text-2xl font-black tracking-tight text-[#102746]">
        {title}
      </h3>

      <p className="mt-3 max-w-md text-sm leading-6 text-[#667085]">
        {description}
      </p>

    </Link>
  );
}