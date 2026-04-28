import { useMemo } from 'react'
import { BarChart3 } from 'lucide-react'

export default function MultiCctvCountsCard({ cameras }) {
  const cameraIds = useMemo(() => Object.keys(cameras ?? {}), [cameras])
  const rows = useMemo(() => cameraIds.map((id, i) => ({
    id,
    label: cameras[id]?.label ?? `Camera ${i + 1}`,
    count: cameras[id]?.count ?? 0,
  })), [cameraIds, cameras])

  const total = useMemo(() => rows.reduce((s, r) => s + (r.count || 0), 0), [rows])

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-black/10 dark:border-white/6 flex items-center gap-2">
        <BarChart3 size={16} className="text-brand-500" />
        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Camera Counts</h3>
      </div>

      <div className="p-4 flex flex-col gap-2">
        {rows.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-gray-600 py-6 text-center">
            No cameras added
          </div>
        ) : (
          <>
            {rows.map((r, idx) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/4 border border-black/10 dark:border-white/10"
              >
                <div className="text-sm font-semibold text-slate-800 dark:text-gray-200">
                  Camera {idx + 1}:
                </div>
                <div className="px-3 py-1 rounded-full bg-brand-500/12 border border-brand-500/25 text-brand-600 dark:text-brand-400 font-black text-sm">
                  {r.count}
                </div>
              </div>
            ))}

            <div className="pt-2 flex items-center justify-between">
              <div className="text-lg font-black text-slate-900 dark:text-white">Grand Total:</div>
              <div className="text-lg font-black text-slate-900 dark:text-white">{total}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

