# MyWay — 여행 플래너

`design_handoff_myway_app` 핸드오프 패키지를 기반으로 재구현한 실제 동작 웹앱입니다. Vite + React로 빌드하며,
Firebase(Auth + Firestore)를 백엔드로 사용해 가족·친구와 함께 여행을 계획하는 협업 앱입니다.

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
  screens/         # Home, Itinerary, Map, Checklist, AiWizard, Settings, AuthScreen, AcceptInvite
  components/      # TabBar, Toast, NewTripSheet, ShareSheet, ActivityFeed, CommentSheet,
                   # NotificationBell, AssigneePicker, ImportLocalTrips 등 공용 컴포넌트
  store/           # AuthContext(Firebase Auth) + TravelContext(Firestore 실시간 동기화)
  data/            # 디자인 토큰 값(지도 제공사, 연료 옵션, 카드 그라데이션 등)
  lib/             # firebase/firebaseKeys, permissions, activity, notifications, invites,
                   # presence, aiClient(AI 위저드), mapProviders/mapKeys/mapSdkLoader(지도)
netlify/functions/ # ai-wizard.js — Claude API 서버사이드 프록시 (Netlify Function)
firestore.rules    # Firestore 보안 규칙 (Firebase Console에 붙여넣기)
public/
  jeju-planner.html # 이전 버전(완도-제주 왕복 개인용 일정 관리 앱), 독립 정적 페이지로 보존
```

## 지도 API 키 설정 (Google / 카카오맵 / 네이버 지도)

세 지도 모두 API 키를 등록하면 실제 인터랙티브 지도(SDK 렌더링)로 동작하고, 지도를 탭해서 일정에
장소를 바로 추가할 수 있습니다. Google은 키가 없어도 iframe 임베드로 동작하지만(줌은 Ctrl+스크롤
필요), 키를 등록하면 카카오/네이버와 동일하게 자유롭게 확대·이동되고 클릭으로 일정 추가도 가능합니다.
이 키들은 서버 비밀키가 아니라 브라우저에서 쓰는 클라이언트 키라(도메인 등록으로 보호), Netlify
환경변수에 `VITE_` 접두사로 등록하면 됩니다.

**1. Google 지도 키 발급**
1. `https://console.cloud.google.com` → 새 프로젝트 생성
2. 결제(Billing) 계정 연결 (매월 $200 무료 크레딧 제공)
3. API 및 서비스 → 라이브러리 → **Maps JavaScript API** 사용 설정 (지도 중심 이동에 쓰는 주소 검색까지 쓰려면 **Geocoding API**도 함께 사용 설정)
4. API 및 서비스 → 사용자 인증 정보 → API 키 만들기
5. 키 편집 → 애플리케이션 제한사항을 HTTP 리퍼러로 설정 → `https://myowntravel.netlify.app/*` 추가, API 제한사항은 Maps JavaScript API(+ Geocoding API)만 체크

**2. 카카오맵 키 발급**
1. `https://developers.kakao.com` 로그인 → 내 애플리케이션 → 애플리케이션 추가
2. 앱 설정 → 플랫폼 → Web 플랫폼 등록에 배포 도메인 추가 (예: `https://myowntravel.netlify.app`)
3. 앱 키 목록에서 **JavaScript 키** 복사

**3. 네이버 지도 키 발급**
1. `https://www.ncloud.com` (네이버 클라우드 플랫폼) 가입/로그인 → Console
2. AI·Application Service → Maps → Application 등록
3. Web 서비스 URL에 배포 도메인 추가 (예: `https://myowntravel.netlify.app`)
4. 발급된 **Client ID** 복사

**4. Netlify에 환경변수 등록**
Site configuration → Environment variables → 아래 세 개 추가:
- `VITE_GOOGLE_MAPS_KEY` = Google Maps API 키
- `VITE_KAKAO_MAP_KEY` = 카카오 JavaScript 키
- `VITE_NAVER_MAP_CLIENT_ID` = 네이버 Client ID

⚠️ `ANTHROPIC_API_KEY`(서버 함수 전용)와 달리, 이 값들은 `VITE_` 접두사가 붙은 **빌드 타임** 변수라 저장 후
반드시 "Deploy project without cache"로 재배포해야 번들에 반영됩니다.

설정 후 지도 화면에서 각 제공사를 선택하면 실제 지도가 뜨고, 지도를 탭하면 그 위치가 현재 보고 있는
Day의 일정에 바로 추가됩니다 (장소 이름은 좌표로 기본 채워지며, 추가 전에 직접 수정 가능). 키를 등록하지
않은 제공사는 "연동 필요" 안내 카드로 자동 폴백합니다 (Google만 예외로 iframe 폴백).

## Firebase 설정 (협업 기능 — 계정/공유/실시간 동기화)

로그인, 여행 공유, 실시간 동기화, 댓글, 알림 등 협업 기능은 전부 Firebase(Auth + Firestore) 위에서
동작합니다. 아래 순서대로 한 번만 설정하면 됩니다.

**1. Firebase 프로젝트 생성**
1. `https://console.firebase.google.com` → 프로젝트 추가 → 이름 입력(예: `myway-travel`) 후 생성
2. 왼쪽 메뉴 **Authentication** → 시작하기 → 로그인 방법 탭 → **이메일/비밀번호** 사용 설정
3. 왼쪽 메뉴 **Firestore Database** → 데이터베이스 만들기 → 위치 선택(예: `asia-northeast3` 서울) → **프로덕션 모드**로 시작

**2. 웹 앱 등록 + 설정 값 복사**
1. 프로젝트 개요 옆 톱니바퀴 → 프로젝트 설정 → 아래로 스크롤 → "앱 추가" → 웹(`</>`) 선택
2. 앱 닉네임 입력(예: `myway-web`) → 앱 등록 (Firebase Hosting은 체크 안 해도 됨, Netlify를 계속 씁니다)
3. 표시되는 `firebaseConfig` 객체에서 아래 6개 값을 복사해둡니다: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`

**3. Netlify에 환경변수 등록**
Site configuration → Environment variables → 아래 6개 추가 (지도 키와 동일하게 `VITE_` 접두사 필수):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

등록 후 **"Deploy project without cache"**로 재배포해야 번들에 반영됩니다 (빌드 타임 변수라서).

**4. Firestore 보안 규칙 적용**
1. Firebase Console → Firestore Database → **규칙** 탭
2. 이 저장소의 `firestore.rules` 파일 내용을 그대로 복사해서 붙여넣고 **게시**

**5. 승인된 도메인 등록 (로그인 팝업/리디렉션에 필요할 수 있음)**
Authentication → Settings → 승인된 도메인에 `myowntravel.netlify.app`이 이미 있는지 확인 (Firebase가 보통 자동 추가하지만, 없으면 직접 추가)

**6. 첫 실행 시 자주 보이는 안내**
- 다른 사람이 이메일로 초대한 뒤 "가입/로그인 시 초대 알림"이 뜨지 않고 콘솔에 `requires an index`
  에러가 보이면, 그 에러 메시지에 있는 링크를 눌러 인덱스를 한 번 생성해주면 이후로는 정상 동작합니다
  (이메일 초대의 `pendingInvites` 조회에 쓰이는 collection group 쿼리용 인덱스입니다).
- 기존에 이 기기 `localStorage`에 저장돼 있던 여행이 있다면, 로그인 후 자동으로 "가져오기" 팝업이 한 번
  뜹니다.

## 목표 스택 연동 상태

핸드오프 README(`design_handoff_myway_app/README.md`) 기준 실제 제품 연동 진행 상황입니다.

| 항목 | 상태 | 비고 |
|---|---|---|
| Firebase Auth / Firestore | 연동 완료 | 이메일/비밀번호 로그인 + 여행/멤버/댓글/활동/알림 전부 Firestore 실시간 동기화. 위 "Firebase 설정" 섹션 참고 |
| 여행 공유/역할(Owner·Editor·Viewer·Custom) | 연동 완료 | 일정 화면 우측 상단 👥 버튼 → 링크 초대(만료·비밀번호) / 이메일 초대 / 멤버 역할 관리 (`src/components/ShareSheet.jsx`) |
| 실시간 공동 편집 | 연동 완료(단, last-write-wins) | Firestore `onSnapshot`으로 일정/체크리스트/댓글/멤버가 즉시 동기화됩니다. 다만 두 사람이 정확히 같은 필드를 동시에 고치면 나중에 저장한 값이 이깁니다 — 실제 Google Docs처럼 글자 단위로 합쳐주는 건 아닙니다 |
| 댓글/멘션/좋아요, 활동 내역, 담당자 지정, 일정 제안 | 연동 완료 | 각각 `CommentSheet` / `ActivityFeed` / `AssigneePicker` / 일정 화면의 "제안된 일정" 섹션 |
| 알림 | 앱 내 알림만 | 초대·담당자 지정·멘션 시 🔔 알림이 옵니다. 실제 이메일 발송/푸시 발송은 아직 붙이지 않았습니다(별도 서비스+요금 필요) |
| 변경 이력(버전 복원), QR 코드 초대 | 미구현 | Phase 2로 보류 (사용자 확인 후 필요 시 추가) |
| Google / 네이버 / 카카오 지도 | 연동 완료 | `VITE_GOOGLE_MAPS_KEY` / `VITE_KAKAO_MAP_KEY` / `VITE_NAVER_MAP_CLIENT_ID` 설정 시 실제 SDK 지도 렌더링 + 클릭/검색으로 일정에 장소 추가. Google은 키 미설정 시 iframe 임베드로, 카카오/네이버는 안내 카드로 폴백 (`src/screens/MapScreen.jsx`) |
| Claude API (AI 위저드) | 서버 프록시 준비됨 | `netlify/functions/ai-wizard.js`가 Anthropic API를 서버사이드에서 호출하도록 구현됨. Netlify 환경변수에 `ANTHROPIC_API_KEY`를 설정하면 바로 동작. 미설정 시 클라이언트가 오프라인 데모 응답으로 폴백 (`src/lib/aiClient.js`) |
| GitHub | 완료 | 이 저장소 |

## 데이터 구조 (Firestore)

```
users/{uid}                        # name, email, mapPrefs, fuelType
users/{uid}/notifications/{id}     # type, tripId, message, read

trips/{tripId}                     # destination, dateLabel, country, transport, coverImage,
                                    # ownerId, memberIds:[uid], days:[[stop]], checklist:[item]
trips/{tripId}/members/{uid}       # role(owner|editor|viewer|custom), customPermissions, name, email
trips/{tripId}/invites/{id}        # role, expiresAt, passwordHash, createdBy   (링크 초대)
trips/{tripId}/pendingInvites/{email} # role, invitedBy, tripDestination        (이메일 초대)
trips/{tripId}/proposals/{id}      # dayIndex, stop, proposedBy                 (뷰어의 일정 제안)
trips/{tripId}/activity/{id}       # type, authorId, authorName, message, createdAt
trips/{tripId}/comments/{id}       # targetKey(=stop.id), authorId, text, parentId, likes, mentions
trips/{tripId}/presence/{uid}      # lastActiveAt                               (온라인 표시)
trips/{tripId}/editingLocks/{stopId} # uid, name, updatedAt                     ("OO님이 수정 중")

stop = { id, time, name, category, stay, lat, lng, assigneeId }
checklist item = { id, text, done, assigneeId, doneBy, doneAt }
```

`mapPrefs`(지도 제공사 선호)와 `fuelType`은 여행이 아니라 **계정별** 설정이라 `users/{uid}` 문서에 둡니다 —
같은 여행이라도 사람마다 좋아하는 지도 앱이 다를 수 있어서입니다.
