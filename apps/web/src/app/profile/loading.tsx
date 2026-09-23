import { LoadingScreen } from '@/components/loading-screen';

export default function Loading() {
  return (
    <div className="space-y-8">
      <LoadingScreen compact />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14 rounded-2xl" />)}</div>
        <div className="space-y-5"><div className="skeleton h-72 rounded-3xl" /><div className="skeleton h-56 rounded-3xl" /></div>
      </div>
    </div>
  );
}
