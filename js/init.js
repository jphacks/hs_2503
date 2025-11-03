// js/init.js
// 💡 index.html から移動したロジックを格納

let currentScript = null;

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
    if (currentScript) { currentScript.remove(); currentScript = null; }
    const mapContainer = document.getElementById("map");
    if (mapContainer) mapContainer.innerHTML = "";

    const script = document.createElement("script");
    // 💡 修正: &libraries=marker&loading=async を追加
    script.src = `https://maps.googleapis.com/maps/api/js?key=${window.GOOGLE_MAPS_API_KEY}&language=${lang}&libraries=marker&loading=async&callback=initMap`;
    script.defer = true;
    script.async = true;
    document.head.appendChild(script);
    currentScript = script;
}

// 🌐 言語切り替えイベントリスナーを設定
document.getElementById("language-select").addEventListener("change", (e) => {
    const newLang = e.target.value;
    loadGoogleMaps(newLang);
    // 他のUIファイルの関数を呼ぶ
    if (window.loadDisasterInfo) window.loadDisasterInfo();
    if (window.changeLanguage) changeLanguage(newLang); 
});

// 🏁 初回ロード処理
document.addEventListener("DOMContentLoaded", () => {
    // index.htmlで設定された currentLang を使用
    loadGoogleMaps(window.currentLang);
});