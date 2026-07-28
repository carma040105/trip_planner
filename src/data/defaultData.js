export const GRADIENTS = [
  'linear-gradient(120deg, #f2a6c4, #f7cf9e)',
  'linear-gradient(120deg, #5f7fb8, #8fb8d8)',
  'linear-gradient(120deg, #6fae8e, #b9d998)',
  'linear-gradient(120deg, #e2935a, #f2c37e)',
];

export const PROVIDER_META = {
  google: { name: 'Google 지도', short: 'Google', emoji: '🌍' },
  naver: { name: '네이버 지도', short: '네이버', emoji: '🧭' },
  kakao: { name: '카카오맵', short: '카카오', emoji: '💛' },
};

export const FUEL_OPTIONS = [
  { id: 'gasoline', name: '휘발유', emoji: '⛽' },
  { id: 'diesel', name: '경유', emoji: '🛢️' },
  { id: 'hybrid', name: '하이브리드', emoji: '🔋' },
  { id: 'electric', name: '전기', emoji: '⚡' },
  { id: 'lpg', name: 'LPG', emoji: '🔥' },
  { id: 'hydrogen', name: '수소', emoji: '💧' },
];

export function defaultData() {
  return {
    accounts: [{ id: 'a1', name: 'carma', email: 'carma@myway.app' }],
    currentAccountId: 'a1',
    trips: [
      {
        id: 't1',
        ownerId: 'a1',
        destination: '도쿄 벚꽃 여행',
        dateLabel: '2026.3.28 – 4.2',
        country: 'overseas',
        transport: null,
        private: true,
        days: [
          [
            { time: '09:00', name: '센소지', category: '관광 명소', stay: '1시간' },
            { time: '12:00', name: '스시 잔마이 아사쿠사', category: '식당', stay: '1시간 30분' },
          ],
          [],
        ],
        checklist: [
          { id: 'c1', text: '여권 유효기간 확인', done: false, assigneeId: null },
          { id: 'c2', text: '엔화 환전', done: false, assigneeId: null },
        ],
      },
      {
        id: 't2',
        ownerId: 'a1',
        destination: '제주 자전거 일주',
        dateLabel: '2026.5.2 – 5.5',
        country: 'domestic',
        transport: 'bike',
        private: true,
        days: [[{ time: '08:00', name: '협재해수욕장', category: '자연', stay: '1시간' }]],
        checklist: [{ id: 'c1', text: '자전거 헬멧', done: false, assigneeId: null }],
      },
    ],
    mapPrefs: { overseas: 'google', domesticCar: 'naver', domesticBike: 'kakao' },
    fuelType: 'gasoline',
    lastTripId: 't1',
  };
}
