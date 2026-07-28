# MyWay — 여행 플래너

`design_handoff_myway_app` 핸드오프 패키지를 기반으로 재구현한 실제 동작 웹앱입니다. Vite + React로 빌드하며,
현재는 브라우저 `localStorage`에 데이터를 저장하는 개인용(단일 사용자, 로그인 없음) 버전입니다.

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
  screens/         # Home, Itinerary, Map, Checklist, AiWizard, Settings
  components/      # TabBar, Toast, NewTripSheet 등 공용 컴포넌트
  store/           # TravelContext — 앱 상태 + localStorage 영속화
  data/            # 기본 데이터, 디자인 토큰 값(지도 제공사, 연료 옵션 등)
  lib/             # aiClient(AI 위저드), mapProviders/mapKeys/mapSdkLoader(지도)
netlify/functions/ # ai-wizard.js — Claude API 서버사이드 프록시 (Netlify Function)
public/
  jeju-planner.html # 이전 버전(완도-제주 왕복 개인용 일정 관리 앱), 독립 정적 페이지로 보존
```

## 지도 API 키 설정 (카카오맵 / 네이버 지도)

Google 지도는 API 키 없이 iframe 임베드로 동작합니다. 카카오맵·네이버 지도는 실제 지도를 표시하고
지도를 탭해서 일정에 장소를 추가하려면 각 서비스의 API 키가 필요합니다. 이 키들은 서버 비밀키가 아니라
브라우저에서 쓰는 클라이언트 키라(도메인 등록으로 보호), Netlify 환경변수에 `VITE_` 접두사로 등록하면 됩니다.

**1. 카카오맵 키 발급**
1. `https://developers.kakao.com` 로그인 → 내 애플리케이션 → 애플리케이션 추가
2. 앱 설정 → 플랫폼 → Web 플랫폼 등록에 배포 도메인 추가 (예: `https://myowntravel.netlify.app`)
3. 앱 키 목록에서 **JavaScript 키** 복사

**2. 네이버 지도 키 발급**
1. `https://www.ncloud.com` (네이버 클라우드 플랫폼) 가입/로그인 → Console
2. AI·Application Service → Maps → Application 등록
3. Web 서비스 URL에 배포 도메인 추가 (예: `https://myowntravel.netlify.app`)
4. 발급된 **Client ID** 복사

**3. Netlify에 환경변수 등록**
Site configuration → Environment variables → 아래 두 개 추가:
- `VITE_KAKAO_MAP_KEY` = 카카오 JavaScript 키
- `VITE_NAVER_MAP_CLIENT_ID` = 네이버 Client ID

⚠️ `ANTHROPIC_API_KEY`(서버 함수 전용)와 달리, 이 두 값은 `VITE_` 접두사가 붙은 **빌드 타임** 변수라 저장 후
반드시 "Deploy project without cache"로 재배포해야 번들에 반영됩니다.

설정 후 지도 화면에서 카카오/네이버를 선택하면 실제 지도가 뜨고, 지도를 탭하면 그 위치가 현재 보고 있는
Day의 일정에 바로 추가됩니다 (장소 이름은 좌표로 기본 채워지며, 추가 전에 직접 수정 가능).

## 목표 스택 연동 상태

핸드오프 README(`design_handoff_myway_app/README.md`) 기준 실제 제품 연동 진행 상황입니다.

| 항목 | 상태 | 비고 |
|---|---|---|
| Firebase Auth / Firestore | 미연동 | 현재 개인용 단일 사용자 앱이라 로그인 화면 자체를 제거함. 데이터는 `localStorage`. 필요해지면 `src/store/TravelContext.jsx`의 `loadData`/`saveData`를 Firestore 호출로 교체 |
| Google Maps | 부분 연동 | API 키 없이 `google.com/maps?...&output=embed` iframe 사용 |
| 네이버 지도 / 카카오맵 | 연동 완료 | `VITE_KAKAO_MAP_KEY` / `VITE_NAVER_MAP_CLIENT_ID` 설정 시 실제 SDK 지도 렌더링 + 클릭으로 일정에 장소 추가. 미설정 시 안내 카드로 폴백 (`src/screens/MapScreen.jsx`) |
| Claude API (AI 위저드) | 서버 프록시 준비됨 | `netlify/functions/ai-wizard.js`가 Anthropic API를 서버사이드에서 호출하도록 구현됨. Netlify 환경변수에 `ANTHROPIC_API_KEY`를 설정하면 바로 동작. 미설정 시 클라이언트가 오프라인 데모 응답으로 폴백 (`src/lib/aiClient.js`) |
| GitHub | 완료 | 이 저장소 |

## 상태 저장 구조

```
{
  accounts: [{id,name,email}], currentAccountId,
  trips: [{id, ownerId, destination, dateLabel, country, transport, private,
            days:[[stop]], checklist:[{id,text,done}]}],
  mapPrefs: {overseas, domesticCar, domesticBike},
  fuelType, lastTripId
}
```

Firestore로 전환 시 `accounts` → Firebase Auth 사용자, `trips` → `trips` 컬렉션(`ownerId`/`private` 필드로 보안 규칙 구성),
`mapPrefs`/`fuelType` → 사용자 문서 설정 필드로 매핑하는 것을 권장합니다 (핸드오프 문서 기준).
