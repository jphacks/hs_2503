// js/init.js (修正案)
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

document.getElementById("language-select").addEventListener("change", (e) => {
    const newLang = e.target.value;
    console.log(`🌐 言語切り替え → ${newLang}`);
    
    // ★★★ 修正ポイント ★★★
    // init.jsがスクリプトのロード/削除を行わず、map.jsの専用関数を呼び出す
    if (window.changeMapLanguage) {
        window.changeMapLanguage(newLang);
    }

    if (window.loadDisasterInfo) window.loadDisasterInfo(newLang);
});

document.addEventListener("DOMContentLoaded", () => {
    loadGoogleMaps(window.currentLang || "ja");
});