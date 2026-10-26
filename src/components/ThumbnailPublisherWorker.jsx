import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { pendingThumbnails, publishThumbnail } from '../services/thumbnailPublishingService.js';
import { homeSchemaMissing } from '../utils/homeSummary.js';

export default function ThumbnailPublisherWorker({ ownerId }) {
  const { i18n } = useTranslation();
  useEffect(() => {
    const controller = new AbortController(), failures = new Map();
    let running = false, stopped = false, timer;
    const run = async () => {
      if (running || stopped || controller.signal.aborted || document.hidden) return;
      running = true;
      clearTimeout(timer);
      try {
        const items = await pendingThumbnails(supabase, ownerId, controller.signal);
        for (const item of items) {
          if (controller.signal.aborted || document.hidden) break;
          const key = item.id + ':' + item.revision, failure = failures.get(key);
          if (failure && (failure.count >= 3 || Date.now() - failure.time < 60000)) continue;
          try {
            const saved = await publishThumbnail({ client: supabase, ownerId, item, signal: controller.signal,
              render: async (row, signal) => {
                const { renderRiskThumbnail } = await import('../utils/renderRiskThumbnail');
                return renderRiskThumbnail(row, i18n, signal);
              },
            });
            if (saved) {
              failures.delete(key);
              window.dispatchEvent(new Event('jsa-thumbnail-ready'));
            } else failures.set(key, { count: 3, time: Date.now() });
          } catch (error) {
            if (controller.signal.aborted) break;
            failures.set(key, { count: (failure?.count || 0) + 1, time: Date.now() });
            // Saving/publishing a document succeeds independently of previews.
            console.warn('JSA thumbnail deferred:', error.code || error.message || 'upload failed');
          }
        }
      } catch (error) {
        if (homeSchemaMissing(error)) stopped = true; // Migration not installed yet.
        else if (!controller.signal.aborted) console.warn('JSA thumbnail queue deferred:', error.code || error.message);
      } finally {
        running = false;
        if (!stopped && !controller.signal.aborted) timer = setTimeout(run, 15000);
      }
    };
    const wake = () => { clearTimeout(timer); timer = setTimeout(run, 1500); };
    wake();
    window.addEventListener('jsa-storage-changed', wake);
    window.addEventListener('focus', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      controller.abort(); clearTimeout(timer);
      window.removeEventListener('jsa-storage-changed', wake);
      window.removeEventListener('focus', wake);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [ownerId, i18n]);
  return null;
}
