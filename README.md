# MyWay — 여행 플래너

`design_handoff_myway_app` 핸드오프 패키지를 기반으로 재구현한 실제 동작 웹앱입니다. Vite + React로 빌드하며,
현재는 브라우저 `localStorage`에 데이터를 저장하는 프런트엔드 전용 버전입니다.

## 개발 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build   # dist/ 생성
npm run preview # 빌드 결과 로컬 확인
```

## 배포 (Netlify)

`netlify.toml`에 빌드 커맨드(`npm run build`)와 publish 디렉터리(`dist`)가 설정되어 있습니다.
Netlify에 저장소를 연결하면 별도 설정 없이 배포됩니다.

## 프로젝트 구조

```
src/
  screens/        # Login, Home, Itinerary, Map, AiWizard, Settings
  components/      # TabBar, Toast, NewTripSheet 등 공용 컴포넌트
  store/           # TravelContext — 앱 상태 + localStorage 영속화
  data/            # 기본 데이터, 디자인 토큰 값(지도 제공사, 연료 옵션 등)
  lib/             # aiClient(AI 위저드), mapProviders(지도 제공사 유틸)
netlify/functions/ # ai-wizard.js — Claude API 서버사이드 프록시 (Netlify Function)
public/
  jeju-planner.html # 이전 버전(완도-제주 왕복 개인용 일정 관리 앱), 독립 정적 페이지로 보존
```

## 목표 스택 연동 상태

핸드오프 README(`design_handoff_myway_app/README.md`) 기준 실제 제품 연동 진행 상황입니다.

| 항목 | 상태 | 비고 |
|---|---|---|
| Firebase Auth / Firestore | 미연동 | 현재 로그인은 UI만 존재, 데이터는 `localStorage`. `src/store/TravelContext.jsx`의 `loadData`/`saveData`를 Firestore 호출로 교체하면 됨 |
| Google Maps | 부분 연동 | API 키 없이 `google.com/maps?...&output=embed` iframe 사용 (프로토타입과 동일). 실제 서비스에서는 Maps JS SDK + API 키로 교체 권장 |
| 네이버 지도 / 카카오맵 | 미연동 | 지도 화면에서 선택 시 "API 키 연동 필요" 안내 카드 표시. `src/screens/MapScreen.jsx`에 SDK 연동 지점 있음 |
| Claude API (AI 위저드) | 서버 프록시 준비됨 | `netlify/functions/ai-wizard.js`가 Anthropic API를 서버사이드에서 호출하도록 구현됨. Netlify 환경변수에 `ANTHROPIC_API_KEY`를 설정하면 바로 동작. 미설정 시 클라이언트가 오프라인 데모 응답으로 폴백 (`src/lib/aiClient.js`) |
| GitHub | 완료 | 이 저장소 |

## 상태 저장 구조

```
{
  loggedIn, accounts: [{id,name,email}], currentAccountId,
  trips: [{id, ownerId, destination, dateLabel, country, transport, private, days:[[stop]]}],
  mapPrefs: {overseas, domesticCar, domesticBike},
  fuelType, lastTripId
}
```

Firestore로 전환 시 `accounts` → Firebase Auth 사용자, `trips` → `trips` 컬렉션(`ownerId`/`private` 필드로 보안 규칙 구성),
`mapPrefs`/`fuelType` → 사용자 문서 설정 필드로 매핑하는 것을 권장합니다 (핸드오프 문서 기준).
