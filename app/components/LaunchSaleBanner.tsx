'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

// Set this to the exact moment the sale should end (3 days from launch).
// Using a fixed ISO timestamp (not "now + 3 days" computed per-visitor)
// so every visitor sees the same countdown regardless of when they load the page.
const SALE_END = new Date('2026-08-14T21:25:00Z'); // ← adjust to your exact launch time + 3 days

const DISMISS_KEY = 'launchSaleBannerDismissed';

function getTimeLeft() {
  const diff = SALE_END.getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export default function LaunchSaleBanner() {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);
  const [dismissed, setDismissed] = useState(true); // default hidden until checked, avoids flash
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const wasDismissed = localStorage.getItem(DISMISS_KEY) === 'true';
    setDismissed(wasDismissed);
    setTimeLeft(getTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  if (!mounted || dismissed || !timeLeft) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="relative bg-[#f8f4f0] border-b border-[#e8dfd3]">
     <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-center gap-3 md:gap-5 flex-wrap text-center">

        <span className="italic text-lg md:text-xl text-[#3a2f2f] font-light" style={{ fontFamily: 'Georgia, serif' }}>
          Launch Sale
        </span>

        <span className="hidden sm:inline text-[#c9a38f]">·</span>

        <span className="text-xs md:text-sm tracking-widest uppercase text-[#6b5d54]">
          50% Off Everything, For A Little While Longer
        </span>

        <div className="flex items-center gap-1.5 text-[#3a2f2f]">
          {[
            { value: timeLeft.days, label: 'D' },
            { value: timeLeft.hours, label: 'H' },
            { value: timeLeft.minutes, label: 'M' },
            { value: timeLeft.seconds, label: 'S' },
          ].map((unit, i) => (
            <div key={unit.label} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[#c9a38f]">:</span>}
              <div className="flex flex-col items-center leading-none">
                <span className="text-sm md:text-base font-medium tabular-nums">{pad(unit.value)}</span>
                <span className="text-[9px] text-[#a89a8c] mt-0.5">{unit.label}</span>
              </div>
            </div>
          ))}
        </div>

        <a
          href="/sale"
          className="bg-[#3a2f2f] text-white text-xs tracking-widest uppercase px-5 py-2 rounded-sm hover:bg-[#2a2222] transition whitespace-nowrap"
        >
          Shop Now
        </a>

        <button
          onClick={dismiss}
          aria-label="Close banner"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a89a8c] hover:text-[#3a2f2f] transition"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}