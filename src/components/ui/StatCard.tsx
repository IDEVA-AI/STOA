interface StatCardProps {
  label: string;
  value: string;
  trend: string;
}

export default function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="card-editorial p-4 sm:p-6 bg-surface transition-colors duration-500">
      <p className="mono-label text-[9px] text-warm-gray mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className="font-serif text-xl sm:text-2xl font-black">{value}</h4>
        <span className="text-[10px] font-mono text-success bg-success/10 px-2 py-0.5 rounded-full">{trend}</span>
      </div>
    </div>
  );
}
