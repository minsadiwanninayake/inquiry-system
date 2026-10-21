import { Status } from '@/lib/types';

const styles: Record<Status, string> = {
  New: 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Resolved: 'bg-green-100 text-green-800',
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${styles[status]}`}>
      {status}
    </span>
  );
}