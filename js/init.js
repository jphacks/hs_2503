// js/init.js
let currentScript = null;

function loadGoogleMaps(lang = "ja") {
  console.log(`🌐 初回APIロード言語 → ${lang}`);
  window.currentLang = lang;

  // 初回ロード時のみ、スクリプトを追加
  if (!currentScript) {
    const mapContainer = document.getElementById("map");
    if (mapContainer) mapContainer.innerHTML = "";

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${window.GOOGLE_MAPS_API_KEY}&language=${lang}&libraries=marker&loading=async&callback=initMap`;
    script.defer = true;
    script.async = true;
    document.head.appendChild(script);
    currentScript = script;
  }
}

// 言語セレクタの初期化＆変更ハンドラ
document.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("language-select");
  if (sel) {
    const saved = (window.getCurrentLang && window.getCurrentLang()) || "ja";
    sel.value = saved;
    sel.addEventListener("change", (e) => {
      const newLang = e.target.value;
      console.log(`🌐 言語切り替え → ${newLang}`);

      // 1) 文言・保存
      if (window.changeLanguage) window.changeLanguage(newLang);

      // 2) Google Maps の言語切替（map.js 側に任せる）
      if (window.changeMapLanguage) window.changeMapLanguage(newLang);

      // 3) 災害情報を再描画（都市名・警報・地震情報を選択言語で）
      if (window.loadDisasterInfo) window.loadDisasterInfo(newLang);
    });
  }
});

// 初期ロード
document.addEventListener("DOMContentLoaded", () => {
  loadGoogleMaps((window.getCurrentLang && window.getCurrentLang()) || window.currentLang || "ja");
});
