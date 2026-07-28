let kakaoPromise = null;
let naverPromise = null;

export function loadKakaoMaps(appKey) {
  if (window.kakao && window.kakao.maps) return Promise.resolve(window.kakao);
  if (kakaoPromise) return kakaoPromise;
  kakaoPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
    script.onerror = () => {
      kakaoPromise = null;
      reject(new Error('Kakao Maps SDK failed to load'));
    };
    document.head.appendChild(script);
  });
  return kakaoPromise;
}

export function loadNaverMaps(clientId) {
  if (window.naver && window.naver.maps) return Promise.resolve(window.naver);
  if (naverPromise) return naverPromise;
  naverPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
    script.onload = () => resolve(window.naver);
    script.onerror = () => {
      naverPromise = null;
      reject(new Error('Naver Maps SDK failed to load'));
    };
    document.head.appendChild(script);
  });
  return naverPromise;
}
