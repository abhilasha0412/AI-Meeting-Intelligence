export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0 min';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (mins < 60) {
    return `${mins} min${mins !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

export function formatTime(seconds) {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateString) {
  if (!dateString) return 'Recent';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getSentimentBadge(sentiment) {
  const s = (sentiment || '').toLowerCase();
  switch (s) {
    case 'positive':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-500',
        label: 'Positive'
      };
    case 'constructive':
      return {
        bg: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/20',
        dot: 'bg-sky-500',
        label: 'Constructive'
      };
    case 'concerned':
    case 'negative':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20',
        dot: 'bg-amber-500',
        label: 'Concerned'
      };
    default:
      return {
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        dot: 'bg-indigo-500',
        label: 'Neutral'
      };
  }
}
