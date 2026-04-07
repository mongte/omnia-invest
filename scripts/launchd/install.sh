#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LAUNCH_DIR="$HOME/Library/LaunchAgents"
LOG_DIR="$PROJECT_ROOT/scripts/logs"

echo "=== Trading Data Pipeline — launchd 설치 ==="
echo "  PROJECT_ROOT: $PROJECT_ROOT"
echo ""

# 1. 로그 디렉토리
mkdir -p "$LOG_DIR"
echo "📁 로그 디렉토리: $LOG_DIR"

# 2. plist 생성 (템플릿에서 경로 치환)
for name in pre-market post-market; do
    TEMPLATE="$SCRIPT_DIR/com.omnia.${name}.plist.template"
    OUTPUT="$SCRIPT_DIR/com.omnia.${name}.plist"

    if [ ! -f "$TEMPLATE" ]; then
        echo "❌ 템플릿 파일 없음: $TEMPLATE"
        exit 1
    fi

    sed "s|__PROJECT_ROOT__|${PROJECT_ROOT}|g" "$TEMPLATE" > "$OUTPUT"
    echo "✅ com.omnia.${name}.plist 생성"
done

# 3. plist 등록
for plist in com.omnia.pre-market.plist com.omnia.post-market.plist; do
    launchctl unload "$LAUNCH_DIR/$plist" 2>/dev/null || true
    ln -sf "$SCRIPT_DIR/$plist" "$LAUNCH_DIR/$plist"
    launchctl load "$LAUNCH_DIR/$plist"
    echo "✅ $plist 등록 완료"
done

# 4. Mac 자동 기상 설정 (절전 모드에서도 크론 실행되도록)
echo ""
echo "⏰ Mac 자동 기상 설정 (sudo 권한 필요)"
echo "  평일 07:45 — pre-market 5분 전"
echo "  평일 16:25 — post-market 5분 전"
echo ""
read -p "자동 기상을 설정하시겠습니까? (y/n): " WAKE_CONFIRM
if [ "$WAKE_CONFIRM" = "y" ] || [ "$WAKE_CONFIRM" = "Y" ]; then
    # 기존 반복 스케줄 초기화
    sudo pmset repeat cancel 2>/dev/null || true
    # 평일 07:45 + 16:25 기상
    sudo pmset repeat wakeorpoweron MTWRF 07:45:00
    echo "✅ 평일 07:45 자동 기상 설정 완료"
    echo ""
    echo "⚠️  pmset repeat는 1개의 wakeorpoweron만 지원합니다."
    echo "   16:25 기상은 별도 설정이 필요합니다."
    echo "   대안: 시스템 설정 > 에너지 절약 > '절전 모드 사용 안 함' 권장"
else
    echo "⏭️  자동 기상 설정 건너뜀"
    echo "   팁: 절전 방지를 위해 시스템 설정 > 에너지 절약 에서 설정하세요"
fi

# 5. 확인
echo ""
echo "=== 등록 확인 ==="
launchctl list | grep omnia || echo "(등록된 작업 없음)"
echo ""
echo "=== pmset 스케줄 ==="
pmset -g sched 2>/dev/null || echo "(스케줄 없음)"
echo ""
echo "=== 완료 ==="
echo "  로그: $LOG_DIR/pre-market.log, post-market.log"
echo "  해제: launchctl unload ~/Library/LaunchAgents/com.omnia.*.plist"
