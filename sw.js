/* 토닥토닥 길잡이 — 서비스워커
   앱처럼 설치되게 하고, 인터넷이 잠깐 끊겨도 마지막 화면을 볼 수 있게 합니다.
   ※ 앱 내용을 수정한 뒤에는 아래 CACHE_NAME의 숫자를 올려주세요 (예: v1 → v2).
      그래야 이용자 휴대폰에 새 버전이 반영됩니다. */

const CACHE_NAME = "todak-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// 설치: 기본 파일들을 미리 저장
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {}) // 일부 파일이 없어도 설치는 계속 진행
  );
});

// 활성화: 예전 버전 캐시 정리
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 요청 처리
self.addEventListener("fetch", (e) => {
  const req = e.request;

  // GET 요청만 처리
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 공지사항(구글 앱스스크립트)과 외부 요청은 항상 인터넷에서 최신으로 가져옴
  if (url.origin !== self.location.origin) return;

  // 화면 이동(HTML)은 네트워크 우선 → 실패하면 저장된 화면
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 그 외 파일은 저장된 것 우선 → 없으면 인터넷
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(req, copy));
      return res;
    }).catch(() => cached))
  );
});
