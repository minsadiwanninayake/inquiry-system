import { Status } from '@/lib/types';

const styles: Record<Status, { wrap: string; dot: string }> = {
  New: { wrap: 'bg-sky-50 text-sky-700 ring-sky-600/20', dot: 'bg-sky-500' },
  'In Progress': { wrap: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  Resolved: { wrap: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.wrap}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}