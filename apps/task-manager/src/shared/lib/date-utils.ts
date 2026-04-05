const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Date 객체를 KST(UTC+9) 기준 ISO 8601 문자열로 반환합니다.
 * 형식: 'YYYY-MM-DDTHH:mm:ss.sss+09:00'
 *
 * 기존 UTC ISO 문자열에서 생성한 Date도 정상적으로 KST 변환됩니다 (하위 호환).
 *
 * @param date - 변환할 Date 객체
 * @returns KST 오프셋이 포함된 ISO 8601 문자열
 */
export function toKSTString(date: Date): string {
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  // toISOString()은 항상 UTC 기준이므로 +09:00으로 오프셋 교체
  return kstDate.toISOString().replace('Z', '+09:00');
}

/**
 * ISO 문자열(UTC 또는 오프셋 포함)을 KST 기준 ISO 8601 문자열로 변환합니다.
 * FE에서 기존 저장된 UTC 타임스탬프를 표시할 때 사용합니다.
 *
 * @param isoString - UTC 또는 타임존 정보가 있는 ISO 문자열
 * @returns KST 오프셋이 포함된 ISO 8601 문자열
 */
export function isoToKSTString(isoString: string): string {
  return toKSTString(new Date(isoString));
}

/**
 * ISO 문자열(UTC 또는 오프셋 포함)을 카드 썸네일용 간결한 KST 형식으로 변환합니다.
 * 형식: 'MM/DD HH:mm'
 *
 * @param isoString - UTC 또는 타임존 정보가 있는 ISO 문자열
 * @returns 'MM/DD HH:mm' 형식의 KST 문자열
 */
export function formatKSTShort(isoString: string): string {
  const kstDate = new Date(new Date(isoString).getTime() + KST_OFFSET_MS);
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getUTCDate()).padStart(2, '0');
  const hours = String(kstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

/**
 * ISO 문자열(UTC 또는 오프셋 포함)을 상세 다이얼로그용 전체 KST 형식으로 변환합니다.
 * 형식: 'YYYY년 MM월 DD일 HH:mm'
 *
 * @param isoString - UTC 또는 타임존 정보가 있는 ISO 문자열
 * @returns 'YYYY년 MM월 DD일 HH:mm' 형식의 KST 문자열
 */
export function formatKSTFull(isoString: string): string {
  const kstDate = new Date(new Date(isoString).getTime() + KST_OFFSET_MS);
  const year = kstDate.getUTCFullYear();
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getUTCDate()).padStart(2, '0');
  const hours = String(kstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
}

/**
 * ISO 문자열(UTC 또는 오프셋 포함)을 Activity Log용 KST 형식으로 변환합니다.
 * 형식: 'MM/DD HH:mm:ss'
 *
 * @param isoString - UTC 또는 타임존 정보가 있는 ISO 문자열
 * @returns 'MM/DD HH:mm:ss' 형식의 KST 문자열
 */
export function formatKSTTime(isoString: string): string {
  const kstDate = new Date(new Date(isoString).getTime() + KST_OFFSET_MS);
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getUTCDate()).padStart(2, '0');
  const hours = String(kstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(kstDate.getUTCSeconds()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}:${seconds}`;
}
