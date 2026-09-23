import { LoadingScreen } from '@/components/loading-screen';

export default function Loading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <LoadingScreen compact />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-9 w-28 rounded-full" />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-surface p-6 sm:p-7" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center gap-3"><div className="skeleton h-11 w-11 rounded-full" /><div className="space-y-2"><div className="skeleton h-3.5 w-28" /><div className="skeleton h-3 w-20" /></div></div>
            <div className="skeleton mt-7 h-3 w-20" />
            <div className="skeleton mt-2 h-9 w-32" />
            <div className="skeleton mt-4 h-14 w-full" />
            <div className="mt-5 grid grid-cols-3 gap-4">{[0, 1, 2].map((k) => <div key={k} className="skeleton h-9" />)}</div>
            <div className="skeleton mt-6 h-10 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
