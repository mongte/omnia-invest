"""
Discord Webhook 배치 알림 모듈.

사용법:
    from discord_notifier import send_batch_notification
    send_batch_notification('pre-market-kiwoom', 'success', rows=200, elapsed_sec=45.2)
"""

import httpx
from datetime import datetime, timezone

PROJECT_ROOT = '/Users/aimmo-ai-0091/GitHub/omnia-invest'
ENV_FILE = f'{PROJECT_ROOT}/.env'

COLOR_SUCCESS = 3066993   # #2ECC71
COLOR_ERROR = 15158332    # #E74C3C
COLOR_PARTIAL = 16776960  # #FFC300

_webhook_url: str | None = None
_loaded = False


def _load_webhook_url() -> str | None:
    global _webhook_url, _loaded
    if _loaded:
        return _webhook_url
    _loaded = True

    import os
    url = os.environ.get('DISCORD_WEBHOOK_URL')
    if url:
        _webhook_url = url
        return _webhook_url

    try:
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    if k.strip() == 'DISCORD_WEBHOOK_URL':
                        _webhook_url = v.strip()
                        return _webhook_url
    except FileNotFoundError:
        pass
    return None


def send_batch_notification(
    job_name: str,
    status: str,
    rows: int = 0,
    elapsed_sec: float = 0,
    error_msg: str | None = None,
    extra_fields: list[dict[str, str]] | None = None,
) -> None:
    """Discord Webhook으로 배치 결과 알림 전송."""
    url = _load_webhook_url()
    if not url:
        return

    color = {
        'success': COLOR_SUCCESS,
        'error': COLOR_ERROR,
        'partial': COLOR_PARTIAL,
    }.get(status, COLOR_PARTIAL)

    status_emoji = {'success': '\u2705', 'error': '\u274c', 'partial': '\u26a0\ufe0f'}.get(status, '\u2753')

    fields: list[dict[str, object]] = [
        {'name': 'Status', 'value': f'{status_emoji} {status.upper()}', 'inline': True},
        {'name': 'Rows', 'value': str(rows), 'inline': True},
        {'name': 'Duration', 'value': f'{elapsed_sec:.1f}s', 'inline': True},
    ]

    if error_msg:
        fields.append({'name': 'Error', 'value': f'```{error_msg[:1000]}```', 'inline': False})

    if extra_fields:
        for f in extra_fields:
            fields.append({'name': f['name'], 'value': f['value'], 'inline': f.get('inline', True) in (True, 'true')})

    payload = {
        'embeds': [{
            'title': job_name,
            'color': color,
            'fields': fields,
            'footer': {'text': 'omnia-invest'},
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }],
    }

    try:
        resp = httpx.post(url, json=payload, timeout=10)
        if resp.status_code not in (200, 204):
            print(f'[WARN] Discord 알림 실패: {resp.status_code}')
    except Exception as e:
        print(f'[WARN] Discord 알림 전송 실패: {e}')
