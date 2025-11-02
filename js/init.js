// js/init.js
// 💡 index.html から移動したロジックを格納

let currentScript = null;

// 🌍 初期言語を明示的に設定
window.currentLang = "ja";

/**
 * Google Maps APIを動的にロードし、地図を初期化する
 * @param {string} lang - ロードする言語コード
 */
function loadGoogleMaps(lang = "ja") {
  console.log(`🌐 言語切り替え → ${lang}`);
  window.currentLang = lang;

  // map.jsで定義された追跡停止関数を呼ぶ
  if (window.stopTracking) window.stopTracking();

  // 既存のスクリプトを削除し、マップコンテナをクリア
  if (currentScript) {
    currentScript.remove();
    currentScript = null;
  }
  const mapContainer = document.getElementById("map");
  if (mapContainer) mapContainer.innerHTML = "";

  // Google Maps APIをロード
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${window.GOOGLE_MAPS_API_KEY}&language=${lang}&libraries=marker&loading=async&callback=initMap`;
  script.defer = true;
  script.async = true;
  document.head.appendChild(script);
  currentScript = script;
}

// 🌐 言語切り替えイベントリスナー
document.getElementById("language-select").addEventListener("change", (e) => {
  const newLang = e.target.value;
  loadGoogleMaps(newLang);

  // 他UIファイルの関数を呼ぶ
  if (window.loadDisasterInfo) window.loadDisasterInfo();
  if (window.changeLanguage) changeLanguage(newLang);
});

// 🏁 初回ロード処理
document.addEventListener("DOMContentLoaded", () => {
  // 初期言語を「ja」で地図ロード
  loadGoogleMaps(window.currentLang);
});
