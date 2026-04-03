import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useUiStore } from '../../store/ui';

function bannerMessage(issueType: string | null): string {
  if (issueType === 'missing_env') {
    return 'Service temporarily unavailable due to deployment configuration.';
  }

  if (issueType === 'timeout') {
    return 'Service temporarily unavailable. Backend response timed out.';
  }

  if (issueType === 'network') {
    return 'Service temporarily unavailable. Unable to reach backend.';
  }

  if (issueType === 'server') {
    return 'Service temporarily unavailable due to backend server error.';
  }

  if (issueType === 'bad_json') {
    return 'Service temporarily unavailable due to invalid backend response.';
  }

  return 'Service temporarily unavailable.';
}

export function ApiStatusBanner() {
  const apiUnavailable = useUiStore((state) => state.apiUnavailable);
  const apiIssueType = useUiStore((state) => state.apiIssueType);
  const apiIssueStatus = useUiStore((state) => state.apiIssueStatus);
  const apiIssueEndpoint = useUiStore((state) => state.apiIssueEndpoint);
  const clearApiIssue = useUiStore((state) => state.clearApiIssue);

  if (!import.meta.env.PROD || !apiUnavailable) {
    return null;
  }

  return (
    <section className="rounded-xl border border-warning/60 bg-warning/20 px-4 py-3 text-warning" role="alert" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium text-foreground">{bannerMessage(apiIssueType)}</p>
        <button
          type="button"
          onClick={() => {
            clearApiIssue();
            window.location.reload();
          }}
          className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-full border border-warning/70 px-3 text-xs font-semibold text-foreground transition hover:bg-warning/30"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
      {apiIssueEndpoint || apiIssueStatus ? (
        <p className="mt-2 text-xs text-foreground/85">
          {apiIssueEndpoint ? `Endpoint: ${apiIssueEndpoint}` : 'Endpoint unavailable'}
          {apiIssueStatus ? ` | Status: ${apiIssueStatus}` : ''}
        </p>
      ) : null}
    </section>
  );
}
