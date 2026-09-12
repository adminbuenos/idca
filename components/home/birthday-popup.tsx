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

    // Show immediately.
    setOpen(true);

    // Show again every minute.
    const popupTimer = window.setInterval(() => {
      setOpen(true);
    }, POPUP_INTERVAL);

    return () => {
      window.clearInterval(popupTimer);
    };
  }, [isBirthday]);

  /*
   * Prevent the homepage behind the popup from scrolling.
   */
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  /*
   * Allow Escape key to close the popup.
   */
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
      className="fixed inset-0 z-[9999] overflow-y-auto bg-[#061522]/85 px-3 py-3 backdrop-blur-sm sm:px-5 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Birthday wishes for IDCA President Shri Akash Vijayvargiya"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
    >
      {/* Celebration effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        {/* Confetti */}
        <span className="birthday-confetti left-[5%] top-[12%]">
          ✦
        </span>

        <span className="birthday-confetti left-[14%] top-[72%]">
          ◆
        </span>

        <span className="birthday-confetti left-[30%] top-[6%]">
          ✦
        </span>

        <span className="birthday-confetti left-[72%] top-[10%]">
          ◆
        </span>

        <span className="birthday-confetti left-[90%] top-[68%]">
          ✦
        </span>

        <span className="birthday-confetti left-[64%] top-[88%]">
          ◆
        </span>

        <span className="birthday-confetti left-[3%] top-[44%]">
          ✦
        </span>

        <span className="birthday-confetti left-[95%] top-[40%]">
          ◆
        </span>

        {/* Party poppers */}
        <span className="party-popper left-[1%] top-[14%]">
          🎉
        </span>

        <span className="party-popper right-[1%] top-[14%]">
          🎊
        </span>

        <span className="party-popper bottom-[10%] left-[2%]">
          🎉
        </span>

        <span className="party-popper bottom-[10%] right-[2%]">
          🎊
        </span>

        {/* Firecracker-style bursts */}
        <span className="celebration-burst left-[5%] top-[32%]">
          <i>✦</i>
          <i>✧</i>
          <i>✦</i>
          <i>·</i>
          <i>✧</i>
          <i>✦</i>
        </span>

        <span className="celebration-burst right-[5%] top-[32%]">
          <i>✦</i>
          <i>✧</i>
          <i>✦</i>
          <i>·</i>
          <i>✧</i>
          <i>✦</i>
        </span>
      </div>

      {/* Main popup */}
      <div
        className="relative mx-auto my-auto w-full max-w-5xl overflow-hidden rounded-[24px] border border-white/60 bg-[#fffaf0] shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:rounded-[30px]"
        style={{
          maxHeight: "calc(100dvh - 1.5rem)",
        }}
      >
        {/* Top decorative strip */}
        <div className="h-1.5 bg-gradient-to-r from-[#ef6c00] via-[#f6b73c] to-[#ef6c00] sm:h-2" />

        {/* Close button */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close birthday message"
          className="absolute right-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl font-light text-[#071b2a] shadow-lg transition hover:scale-105 hover:bg-orange-50 active:scale-95 sm:right-5 sm:top-5"
        >
          ×
        </button>

        {/* Scrollable content */}
        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
          <div className="grid md:grid-cols-[1.05fr_0.95fr]">
            {/* President photo */}
            <div className="relative order-first h-[260px] overflow-hidden bg-[#ef6c00] sm:h-[340px] md:order-last md:h-[560px]">
              {/* Decorative background */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_35%),linear-gradient(145deg,#d94d00,#f28a16_55%,#ffc75b)]"
              />

              <div
                aria-hidden="true"
                className="absolute -right-20 -top-20 h-56 w-56 rounded-full border-[20px] border-white/15 sm:h-64 sm:w-64 sm:border-[24px]"
              />

              <div
                aria-hidden="true"
                className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full border-[24px] border-white/15 sm:h-72 sm:w-72 sm:border-[28px]"
              />

              {/* Photo */}
              <div className="absolute inset-0 flex items-end justify-center">
                <Image
                  src="/president-akash.jpg"
                  alt="Shri Akash Vijayvargiya, President of Indore Division Cricket Association"
                  width={700}
                  height={700}
                  priority
                  className="relative z-10 h-full w-full object-contain object-bottom drop-shadow-[0_12px_18px_rgba(0,0,0,0.25)]"
                />
              </div>

              {/* President label */}
              <div className="absolute bottom-3 left-3 right-3 z-20 rounded-xl border border-white/30 bg-[#071b2a]/90 px-3 py-2.5 text-center shadow-xl backdrop-blur-md sm:bottom-5 sm:left-5 sm:right-5 sm:rounded-2xl sm:px-5 sm:py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-orange-200 sm:text-xs sm:tracking-[0.2em]">
                  Hon. President
                </p>

                <p className="mt-0.5 text-sm font-black text-white sm:mt-1 sm:text-lg">
                  Shri Akash Vijayvargiya
                </p>
              </div>

              {/* Cricket decoration */}
              <div
                aria-hidden="true"
                className="absolute right-3 top-3 z-20 flex h-9 w-9 rotate-12 items-center justify-center rounded-full bg-[#8f1d16] text-base shadow-xl sm:right-5 sm:top-5 sm:h-12 sm:w-12 sm:text-xl"
              >
                🏏
              </div>
            </div>

            {/* Birthday message */}
            <div className="relative order-last flex flex-col justify-center px-5 py-7 sm:px-10 sm:py-10 md:order-first md:px-14 md:py-12">
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 h-32 w-32 rounded-full bg-orange-100/60 blur-3xl"
              />

              <div className="relative">
                {/* IDCA badge */}
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ef6c00] sm:mb-5 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.18em]">
                  <span>🏏</span>
                  IDCA Family
                </div>

                {/* Heading */}
                <p className="font-serif text-4xl font-semibold leading-none text-[#b46a00] sm:text-5xl">
                  Happy
                </p>

                <p className="mt-1 font-serif text-5xl font-bold leading-none text-[#071b2a] sm:text-6xl">
                  Birthday
                </p>

                <div className="mt-5 h-1 w-16 rounded-full bg-[#ef6c00] sm:mt-6 sm:w-20" />

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 sm:mt-6 sm:text-sm sm:tracking-[0.2em]">
                  To our esteemed
                </p>

                <h2 className="mt-1 text-2xl font-black leading-tight text-[#071b2a] sm:mt-2 sm:text-4xl">
                  President
                </h2>

                {/* Name */}
                <div className="mt-4 inline-block max-w-full rounded-xl bg-gradient-to-r from-[#a86408] to-[#d89121] px-4 py-2.5 shadow-lg sm:mt-5 sm:px-5 sm:py-3">
                  <p className="text-base font-bold text-white sm:text-xl">
                    Shri Akash Vijayvargiya
                  </p>
                </div>

                {/* Message */}
                <p className="mt-5 text-sm leading-6 text-gray-700 sm:mt-6 sm:text-lg sm:leading-7">
                  Wishing you a very happy birthday. Your
                  vision, leadership and continued support
                  inspire the cricket fraternity of Indore
                  Division.
                </p>

                <p className="mt-3 text-sm font-semibold leading-6 text-[#071b2a] sm:mt-4 sm:text-lg sm:leading-7">
                  May the year ahead bring you good health,
                  happiness and continued success.
                </p>

                {/* Signature */}
                <div className="mt-5 sm:mt-7">
                  <p className="font-serif text-xl italic text-[#a86408] sm:text-2xl">
                    Best Wishes
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500 sm:text-xs sm:tracking-[0.28em]">
                    Team IDCA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .birthday-confetti {
          position: absolute;
          display: block;
          color: #f6b73c;
          font-size: 22px;
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
          font-size: 34px;
          filter: drop-shadow(0 5px 8px rgba(0, 0, 0, 0.25));
          animation: party-pop 2.4s ease-in-out infinite;
        }

        .party-popper:nth-of-type(10) {
          animation-delay: 0.8s;
        }

        .party-popper:nth-of-type(11) {
          animation-delay: 1.3s;
        }

        .party-popper:nth-of-type(12) {
          animation-delay: 1.8s;
        }

        .celebration-burst {
          position: absolute;
          z-index: 4;
          width: 70px;
          height: 70px;
          animation: burst-pulse 2.2s ease-out infinite;
        }

        .celebration-burst i {
          position: absolute;
          left: 50%;
          top: 50%;
          display: block;
          font-style: normal;
          font-size: 20px;
          font-weight: 900;
          color: #f6b73c;
          text-shadow:
            0 0 8px rgba(246, 183, 60, 0.8),
            0 0 18px rgba(239, 108, 0, 0.45);
          transform-origin: center;
        }

        .celebration-burst i:nth-child(1) {
          transform: translate(-50%, -50%) translateY(-30px);
        }

        .celebration-burst i:nth-child(2) {
          transform: translate(-50%, -50%) translate(22px, -22px);
        }

        .celebration-burst i:nth-child(3) {
          transform: translate(-50%, -50%) translateX(30px);
        }

        .celebration-burst i:nth-child(4) {
          transform: translate(-50%, -50%) translate(20px, 20px);
        }

        .celebration-burst i:nth-child(5) {
          transform: translate(-50%, -50%) translate(-22px, 22px);
        }

        .celebration-burst i:nth-child(6) {
          transform: translate(-50%, -50%) translateX(-30px);
        }

        @keyframes birthday-float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }

          50% {
            transform: translateY(-16px) rotate(12deg) scale(1.1);
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

        @media (max-width: 640px) {
          .birthday-confetti {
            font-size: 18px;
          }

          .party-popper {
            font-size: 26px;
          }

          .celebration-burst {
            transform: scale(0.7);
          }

          .celebration-burst.right\\[5\\%\\] {
            display: none;
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