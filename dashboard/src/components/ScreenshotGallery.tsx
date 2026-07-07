import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Screenshot } from "../lib/types";
import { formatDateTime } from "../lib/format";
import { ImageIcon, XIcon } from "./icons";

interface Props {
  timeEntryId: string;
  onClose: () => void;
}

interface ScreenshotWithUrl extends Screenshot {
  url: string | null;
}

export default function ScreenshotGallery({ timeEntryId, onClose }: Props) {
  const [shots, setShots] = useState<ScreenshotWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("screenshots")
        .select("*")
        .eq("time_entry_id", timeEntryId)
        .order("captured_at", { ascending: true });

      if (error || !data) {
        if (!cancelled) setLoading(false);
        return;
      }

      const withUrls = await Promise.all(
        (data as Screenshot[]).map(async (shot) => {
          const { data: signed } = await supabase.storage
            .from("screenshots")
            .createSignedUrl(shot.storage_path, 600);
          return { ...shot, url: signed?.signedUrl ?? null };
        })
      );

      if (!cancelled) {
        setShots(withUrls);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [timeEntryId]);

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 p-6"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 w-full max-w-3xl max-h-[80vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-slate-400" />
            Screenshots for this session
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {loading && (
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="aspect-video rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          )}
          {!loading && shots.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">
              No screenshots captured yet for this session.
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {shots.map((shot) => (
              <button
                key={shot.id}
                onClick={() => shot.url && setLightbox(shot.url)}
                className="group text-left"
              >
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  {shot.url ? (
                    <img
                      src={shot.url}
                      alt="Screenshot"
                      className="w-full h-full object-cover group-hover:opacity-90 group-hover:scale-[1.02] transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      Unavailable
                    </div>
                  )}
                  {shot.activity_percent !== null && (
                    <span
                      className={`absolute top-1.5 right-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md backdrop-blur-sm ${
                        shot.activity_percent >= 50
                          ? "bg-emerald-500/90 text-white"
                          : shot.activity_percent >= 25
                            ? "bg-amber-500/90 text-white"
                            : "bg-red-500/90 text-white"
                      }`}
                    >
                      {shot.activity_percent}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {formatDateTime(shot.captured_at)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-6"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Screenshot full size" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
