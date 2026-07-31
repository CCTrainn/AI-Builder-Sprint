const params = new URLSearchParams(window.location.search);
const requestedWorkplaceId = params.get("workplace_id");
const storedWorkplaceId = readSessionValue("workplace_id");
const workplaceId = requestedWorkplaceId || storedWorkplaceId || "demo-e2e";
const runtimeMode = params.get("mode");

writeSessionValue("workplace_id", workplaceId);
preserveRuntimeContext();

function readSessionValue(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // 브라우저가 저장소 접근을 제한해도 URL 전달은 계속 사용한다.
  }
}

function preserveRuntimeContext() {
  document.querySelectorAll("a[href]").forEach((anchor) => {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (!url.pathname.includes("/frontend/features/")) return;

    url.searchParams.set("workplace_id", workplaceId);
    if (["api", "mock"].includes(runtimeMode)) {
      url.searchParams.set("mode", runtimeMode);
    }
    anchor.href = url.href;
  });
}
