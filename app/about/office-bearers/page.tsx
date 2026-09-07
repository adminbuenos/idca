import Image from "next/image";
import Link from "next/link";

const officeBearers = [
  {
    name: "Hon. Shri Akash Vijayvargiya Ji",
    designation: "President",
    image: "/images/office-bearers/akash-vijayvargiya.jpg",
  },
  {
    name: "Shri Sanjay Lunawat Ji",
    designation: "Chairman",
    image: "/images/office-bearers/sanjay-lunawat.jpg",
  },
  {
    name: "Shri Devashish Nilosey Ji",
    designation: "Secretary",
    image: "/images/office-bearers/devashish-nilosey.jpg",
  },
];

export default function OfficeBearersPage() {
  const president = officeBearers[0];
  const otherBearers = officeBearers.slice(1);

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#071a2d]">

      {/* HERO */}
      <section className="border-b border-[#071a2d]/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">

          <Link
            href="/about"
            className="text-sm font-medium text-[#526274] transition hover:text-[#e86f21]"
          >
            ← Back to About IDCA
          </Link>

          <div className="mt-14 max-w-4xl">
            <div className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#e86f21]" />

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e86f21]">
                Leadership
              </p>
            </div>

            <h1 className="mt-5 text-5xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              The people
              <br />
              <span className="text-[#e86f21]">
                guiding IDCA.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#526274]">
              Meet the current office bearers of the Indore Division Cricket
              Association.
            </p>
          </div>

        </div>
      </section>


      {/* OFFICE BEARERS */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">

        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e86f21]">
              Current Office Bearers
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Leadership of IDCA
            </h2>
          </div>

          <div className="hidden text-right text-sm text-[#526274] sm:block">
            Indore Division
            <br />
            2026–27
          </div>
        </div>


        {/* PRESIDENT FEATURE */}
        <div className="overflow-hidden rounded-[2rem] border border-[#071a2d]/10 bg-[#071a2d] shadow-xl">

          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">

            <div className="relative min-h-[430px] lg:min-h-[500px]">
              <Image
                src={president.image}
                alt={`${president.name}, ${president.designation}`}
                fill
                className="object-cover object-top"
                priority
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#071a2d]/70 via-transparent to-transparent" />

              <div className="absolute bottom-7 left-7">
                <span className="rounded-full bg-[#e86f21] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
                  {president.designation}
                </span>
              </div>
            </div>


            <div className="flex flex-col justify-center p-8 text-white sm:p-12 lg:p-14">

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#ff9b5b]">
                President
              </p>

              <h3 className="mt-5 max-w-lg text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                {president.name}
              </h3>

              <div className="mt-7 h-1 w-12 rounded-full bg-[#e86f21]" />

              <p className="mt-7 max-w-md text-base leading-7 text-white/65">
                President of the Indore Division Cricket Association.
              </p>

            </div>
          </div>
        </div>


        {/* OTHER BEARERS */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">

          {otherBearers.map((person, index) => (
            <div
              key={person.designation}
              className="group overflow-hidden rounded-[2rem] border border-[#071a2d]/10 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >

              <div className="relative overflow-hidden rounded-t-[28px] bg-[#062f26]">
  <img
    src={person.image}
    alt={`${person.name}, ${person.designation}`}
    className="block h-auto w-full object-contain"
  />

  {/* Subtle sporty overlay */}
  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />

  {/* Designation badge */}
  <div className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-xs font-bold tracking-[0.18em] text-[#ef6c00] shadow-md sm:left-7 sm:top-7 sm:px-5">
    {person.designation.toUpperCase()}
  </div>
</div>


              <div className="p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e86f21]">
                      0{index + 2}
                    </p>

                    <h3 className="mt-3 text-2xl font-black">
                      {person.name}
                    </h3>

                    <p className="mt-2 text-sm text-[#526274]">
                      Indore Division Cricket Association
                    </p>
                  </div>

                  <span className="pt-1 text-2xl text-[#e86f21] transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>

                <div className="mt-7 h-1 w-8 rounded-full bg-[#e86f21] transition-all duration-300 group-hover:w-16" />
              </div>

            </div>
          ))}

        </div>

      </section>


      {/* FOOTER MESSAGE */}
      <section className="border-t border-[#071a2d]/10 bg-[#f1eee7]">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-20">

          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e86f21]">
            Indore Division Cricket Association
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black sm:text-4xl">
            Building a stronger cricketing ecosystem in Indore.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-[#526274]">
            More information about the association, its clubs, tournaments,
            players and competitions will continue to be added to the IDCA
            platform.
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-full bg-[#e86f21] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#cf5e16]"
            >
              Back to IDCA Homepage →
            </Link>
          </div>

        </div>
      </section>

    </main>
  );
}