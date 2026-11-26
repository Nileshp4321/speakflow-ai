export function CardSkeleton() {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 bg-slate-700 rounded w-2/3" />
        <div className="h-5 bg-slate-700 rounded-full w-16" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-700/70 rounded w-full" />
        <div className="h-3 bg-slate-700/70 rounded w-4/5" />
        <div className="h-3 bg-slate-700/70 rounded w-3/5" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-4 bg-slate-700/50 rounded w-20" />
        <div className="h-4 bg-slate-700/50 rounded w-16" />
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-slate-700 rounded w-1/2" />
        <div className="h-9 w-9 bg-slate-700 rounded-xl" />
      </div>
      <div className="h-8 bg-slate-700 rounded w-16 mb-1" />
      <div className="h-3 bg-slate-700/50 rounded w-24" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-slate-700/50 animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 bg-slate-700 rounded w-3/4" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-slate-700 rounded w-1/2" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-slate-700 rounded w-16" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-slate-700 rounded w-24" />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2 justify-end">
          <div className="h-7 w-7 bg-slate-700 rounded-lg" />
          <div className="h-7 w-7 bg-slate-700 rounded-lg" />
          <div className="h-7 w-7 bg-slate-700 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}
