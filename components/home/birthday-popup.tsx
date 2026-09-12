"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const BIRTHDAY_DATE = "2026-09-12";
const POPUP_INTERVAL = 60 * 1000;

export default function BirthdayPopup() {
  const [open, setOpen] = useState(false);
  const [isBirthday, setIsBirthday] = useState(false);

  useEffect(() => {
    function checkBirthday() {
      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");

      const today = `${year}-${month}-${day}`;

      setIsBirthday(today === BIRTHDAY_DATE);
    }

    checkBirthday();

    const birthdayCheck = window.setInterval(
      checkBirthday,
      60 * 1000
    );

    return () => {
      window.clearInterval(birthdayCheck);
    };
  }, []);

  useEffect(() => {
    if (!isBirthday) {
      setOpen(false);
      return;
    }

    // Show immediately when the site is opened.
    setOpen(true);

    // Then show it again every minute.
    const popupTimer = window.setInterval(() => {
      setOpen(true);
    }, POPUP_INTERVAL);

    return () => {
      window.clearInterval(popupTimer);
    };
  }, [isBirthday]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!isBirthday || !open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#061522]/80 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Birthday wishes for IDCA President Shri Akash Vijayvargiya"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
    >
      /* Celebration effects */
<div
  aria-hidden="true"
  className="pointer-events-none absolute inset-0 overflow-hidden"
>
  {/* Confetti */}
  <span className="birthday-confetti left-[7%] top-[15%]">
    ✦
  </span>

  <span className="birthday-confetti left-[14%] top-[70%]">
    ◆
  </span>

  <span className="birthday-confetti left-[28%] top-[7%]">
    ✦
  </span>

  <span className="birthday-confetti left-[72%] top-[10%]">
    ◆
  </span>

  <span className="birthday-confetti left-[88%] top-[65%]">
    ✦
  </span>

  <span className="birthday-confetti left-[64%] top-[88%]">
    ◆
  </span>

  <span className="birthday-confetti left-[4%] top-[45%]">
    ✦
  </span>

  <span className="birthday-confetti left-[95%] top-[40%]">
    ◆
  </span>

  {/* Party poppers */}
  <span className="party-popper left-[3%] top-[18%]">
    🎉
  </span>

  <span className="party-popper right-[3%] top-[18%]">
    🎊
  </span>

  <span className="party-popper bottom-[12%] left-[5%]">
    🎉
  </span>

  <span className="party-popper bottom-[12%] right-[5%]">
    🎊
  </span>

  {/* Firecracker-style bursts */}
  <span className="celebration-burst left-[10%] top-[35%]">
    <i>✦</i>
    <i>✧</i>
    <i>✦</i>
    <i>·</i>
    <i>✧</i>
    <i>✦</i>
  </span>

  <span className="celebration-burst right-[10%] top-[35%]">
    <i>✦</i>
    <i>✧</i>
    <i>✦</i>
    <i>·</i>
    <i>✧</i>
    <i>✦</i>
  </span>

  <span className="celebration-burst bottom-[28%] left-[14%]">
    <i>✧</i>
    <i>✦</i>
    <i>·</i>
    <i>✦</i>
    <i>✧</i>
    <i>✦</i>
  </span>

  <span className="celebration-burst bottom-[28%] right-[14%]">
    <i>✧</i>
    <i>✦</i>
    <i>·</i>
    <i>✦</i>
    <i>✧</i>
    <i>✦</i>
  </span>
</div>

      <div className="relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/60 bg-[#fffaf0] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
        {/* Top decorative strip */}
        <div className="h-2 bg-gradient-to-r from-[#ef6c00] via-[#f6b73c] to-[#ef6c00]" />

        {/* Close button */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close birthday message"
          className="absolute right-4 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl font-light text-[#071b2a] shadow-lg transition hover:scale-105 hover:bg-orange-50"
        >
          ×
        </button>

        <div className="grid md:grid-cols-[1.05fr_0.95fr]">
          {/* Message */}
          <div className="relative flex flex-col justify-center px-7 py-10 sm:px-12 sm:py-12 md:px-14">
            <div
              aria-hidden="true"
              className="absolute left-0 top-0 h-32 w-32 rounded-full bg-orange-100/60 blur-3xl"
            />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#ef6c00]">
                <span>🏏</span>
                IDCA Family
              </div>

              <p className="font-serif text-4xl font-semibold leading-none text-[#b46a00] sm:text-5xl">
                Happy
              </p>

              <p className="mt-1 font-serif text-5xl font-bold leading-none text-[#071b2a] sm:text-6xl">
                Birthday
              </p>

              <div className="mt-6 h-1 w-20 rounded-full bg-[#ef6c00]" />

              <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
                To our esteemed
              </p>

              <h2 className="mt-2 text-3xl font-black leading-tight text-[#071b2a] sm:text-4xl">
                President
              </h2>

              <div className="mt-5 inline-block rounded-xl bg-gradient-to-r from-[#a86408] to-[#d89121] px-5 py-3 shadow-lg">
                <p className="text-lg font-bold text-white sm:text-xl">
                  Shri Akash Vijayvargiya
                </p>
              </div>

              <p className="mt-6 max-w-xl text-base leading-7 text-gray-700 sm:text-lg">
                Wishing you a very happy birthday. Your vision,
                leadership and continued support inspire the
                cricket fraternity of Indore Division.
              </p>

              <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-[#071b2a] sm:text-lg">
                May the year ahead bring you good health,
                happiness and continued success.
              </p>

              <div className="mt-7">
                <p className="font-serif text-2xl italic text-[#a86408]">
                  Best Wishes
                </p>

                <p className="mt-1 text-xs font-bold uppercase tracking-[0.28em] text-gray-500">
                  Team IDCA
                </p>
              </div>
            </div>
          </div>

          {/* President photo */}
          <div className="relative min-h-[360px] overflow-hidden bg-[#ef6c00] md:min-h-[560px]">
            {/* Decorative background */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_35%),linear-gradient(145deg,#d94d00,#f28a16_55%,#ffc75b)]"
            />

            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[24px] border-white/15"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border-[28px] border-white/15"
            />

            {/* Photo */}
            <div className="absolute inset-0 flex items-end justify-center">
              <Image
                src="/president-akash.jpg"
                alt="Shri Akash Vijayvargiya, President of Indore Division Cricket Association"
                width={700}
                height={700}
                priority
                className="relative z-10 h-full w-full object-contain object-bottom drop-shadow-[0_15px_20px_rgba(0,0,0,0.25)]"
              />
            </div>

            {/* Photo label */}
            <div className="absolute bottom-5 left-5 right-5 z-20 rounded-2xl border border-white/30 bg-[#071b2a]/90 px-5 py-4 text-center shadow-xl backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
                Hon. President
              </p>

              <p className="mt-1 text-lg font-black text-white">
                Shri Akash Vijayvargiya
              </p>
            </div>

            {/* Decorative cricket ball */}
            <div
              aria-hidden="true"
              className="absolute right-5 top-5 z-20 flex h-12 w-12 rotate-12 items-center justify-center rounded-full bg-[#8f1d16] text-xl shadow-xl"
            >
              🏏
            </div>
          </div>
        </div>
      </div>
<style jsx>{`
  .birthday-confetti {
    position: absolute;
    display: block;
    color: #f6b73c;
    font-size: 28px;
    animation: birthday-float 3s ease-in-out infinite;
    opacity: 0.9;
  }

  .birthday-confetti:nth-child(2n) {
    color: #ef6c00;
    animation-delay: 0.7s;
  }

  .birthday-confetti:nth-child(3n) {
    color: #ffffff;
    animation-delay: 1.2s;
  }

  .party-popper {
    position: absolute;
    z-index: 5;
    font-size: 42px;
    filter: drop-shadow(0 5px 8px rgba(0, 0, 0, 0.25));
    animation: party-pop 2.4s ease-in-out infinite;
  }

  .party-popper:nth-of-type(2) {
    animation-delay: 0.8s;
  }

  .party-popper:nth-of-type(3) {
    animation-delay: 1.3s;
  }

  .party-popper:nth-of-type(4) {
    animation-delay: 1.8s;
  }

  .celebration-burst {
    position: absolute;
    z-index: 4;
    width: 80px;
    height: 80px;
    animation: burst-pulse 2.2s ease-out infinite;
  }

  .celebration-burst i {
    position: absolute;
    left: 50%;
    top: 50%;
    display: block;
    font-style: normal;
    font-size: 24px;
    font-weight: 900;
    color: #f6b73c;
    text-shadow:
      0 0 8px rgba(246, 183, 60, 0.8),
      0 0 18px rgba(239, 108, 0, 0.45);
    transform-origin: center;
  }

  .celebration-burst i:nth-child(1) {
    transform: translate(-50%, -50%) translateY(-34px);
  }

  .celebration-burst i:nth-child(2) {
    transform: translate(-50%, -50%) translate(24px, -24px);
  }

  .celebration-burst i:nth-child(3) {
    transform: translate(-50%, -50%) translateX(34px);
  }

  .celebration-burst i:nth-child(4) {
    transform: translate(-50%, -50%) translate(22px, 22px);
  }

  .celebration-burst i:nth-child(5) {
    transform: translate(-50%, -50%) translate(-24px, 24px);
  }

  .celebration-burst i:nth-child(6) {
    transform: translate(-50%, -50%) translateX(-34px);
  }

  @keyframes birthday-float {
    0%,
    100% {
      transform: translateY(0) rotate(0deg) scale(1);
    }

    50% {
      transform: translateY(-18px) rotate(12deg) scale(1.1);
    }
  }

  @keyframes party-pop {
    0%,
    100% {
      transform: scale(1) rotate(-8deg);
    }

    20% {
      transform: scale(1.25) rotate(8deg);
    }

    40% {
      transform: scale(0.95) rotate(-4deg);
    }

    60% {
      transform: scale(1.12) rotate(5deg);
    }
  }

  @keyframes burst-pulse {
    0% {
      opacity: 0;
      transform: scale(0.45) rotate(0deg);
    }

    20% {
      opacity: 1;
      transform: scale(1) rotate(15deg);
    }

    45% {
      opacity: 0.95;
      transform: scale(1.15) rotate(30deg);
    }

    75% {
      opacity: 0.3;
      transform: scale(1.35) rotate(45deg);
    }

    100% {
      opacity: 0;
      transform: scale(1.5) rotate(60deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .birthday-confetti,
    .party-popper,
    .celebration-burst {
      animation: none;
    }
  }
`}</style>
    </div>
  );
}