import { useEffect, useMemo, useState } from 'react';

const getNextOctoberFirst = (): Date => {
  const now = new Date();
  const year = now.getMonth() > 9 || (now.getMonth() === 9 && now.getDate() > 1)
    ? now.getFullYear() + 1
    : now.getFullYear();
  return new Date(year, 9, 1, 0, 0, 0, 0);
};

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const getTimeLeft = (target: Date): TimeLeft => {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-16 sm:w-20 md:w-24 rounded-xl border border-yellow-500/30 bg-white/5 backdrop-blur-sm px-2 py-3 md:py-4 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none" />
      <span className="relative block text-center text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="mt-2 text-[10px] sm:text-xs uppercase tracking-widest font-bold text-gray-400">
      {label}
    </span>
  </div>
);

export const SeasonCountdownTimer = () => {
  const target = useMemo(() => getNextOctoberFirst(), []);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="flex items-center gap-2 sm:gap-4">
        <TimeUnit value={timeLeft.days} label="Gün" />
        <span className="text-2xl md:text-3xl font-black text-yellow-500/50 pb-5">:</span>
        <TimeUnit value={timeLeft.hours} label="Saat" />
        <span className="text-2xl md:text-3xl font-black text-yellow-500/50 pb-5">:</span>
        <TimeUnit value={timeLeft.minutes} label="Dakika" />
        <span className="text-2xl md:text-3xl font-black text-yellow-500/50 pb-5">:</span>
        <TimeUnit value={timeLeft.seconds} label="Saniye" />
      </div>

    </div>
  );
};
