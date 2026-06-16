# 카드 일러스트 드롭인 규칙

카드 도감(`gallery.html`)은 각 카드의 일러스트를 **characterId 기준으로 자동 로딩**합니다.

## 방법
1. 캐릭터 그림을 `{characterId}.png` 이름으로 이 폴더에 넣습니다.
   - 예: `HUM-001.png`(서윤), `VMP-001.png`(카멜리아), `ELF-004.png`(에일론), `ENM-AVP-001.png`(발테른)
2. 끝. 도감 카드 앞면에 자동으로 표시됩니다. (파일이 없으면 "일러스트 준비중" 슬롯)

## 권장 사양
- 세로형 카드 비율(약 3:4~4:5), 인물 중심 구도
- 톤: 밝고 명랑한 헌혈의 집 (VISUAL_TONE_GUIDE_001.md 준수)
- 배경 없는/단색/밝은 실내 배경 권장, 폐허·전쟁·고어 금지

## characterId 목록
- 영웅: `hero-roster-by-race.json` (HUM/VMP/WRW/DWF/ELF/SPR/HOB/GLM/AVP/AWR/HYB-00x)
- 적: `enemy-hero-roster.json` (ENM-*)

## 현재 적용된 임시 일러스트(기존 자산 차용)
HUM-001, HUM-003, HUM-004, HUM-005, VMP-002 (구 시뮬 PNG)
