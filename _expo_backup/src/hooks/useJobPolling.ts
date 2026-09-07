import { useEffect, useState } from 'react';

import { getJobStatus, DownloadJob } from '../api/downloader';

export function useJobPolling(jobId: number | null, intervalMs = 2000) {
  const [job, setJob] = useState<DownloadJob | null>(null);

  useEffect(() => {
    if (jobId == null) {
      setJob(null);
      return;
    }

    let cancelled = false;
    const tick = async () => {
      const data = await getJobStatus(jobId);
      if (!cancelled) setJob(data);
      if (!cancelled && data.status !== 'done' && data.status !== 'failed') {
        timer = setTimeout(tick, intervalMs);
      }
    };
    let timer = setTimeout(tick, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId, intervalMs]);

  return job;
}
