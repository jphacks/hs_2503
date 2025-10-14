// map.js
// ============================
// 🌏 グローバル変数
// ============================
let map;
let directionsService;
let directionsRenderer;
let userMarker = null; // AdvancedMarkerElement に変わる
let userCircle = null;
let userPosition = null;
let watchId = null;
let routeRenderers = [];
let routeButtons = [];
let isManuallyPanning = false; // 💡 NEW: ユーザーが手動で地図を動かしたか

// ✅ 外部（HTML側）から呼べるように公開
window.initMap = initMap;
window.stopTracking = stopTracking;


// ============================
// 🗺️ 初期化
// ============================
async function initMap() {
    console.log("🗺️ initMap() 実行");

    // ✅ 最新の位置情報があれば利用
    const latest = window.getLatestPosition ? window.getLatestPosition() : null;
    const defaultPos = latest || { lat: 34.3853, lng: 132.4553 }; // 広島市

    // 新しい地図を生成
    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultPos,
        zoom: 15,
        mapId: '58be1157ad609efe356c49f6', 

        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: "greedy"
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map });

    // 💡 NEW: 地図ドラッグ開始時にフラグを立てる (自動追尾制御)
    map.addListener("dragstart", () => {
        console.log("🗺️ 手動操作開始: 自動追尾を一時停止");
        isManuallyPanning = true;
    });

    // 💬 言語切替直後にも現在地と仮の円を描画
    if (latest) {
        console.log("🟦 最新位置から仮マーカーと円を描画");
        userPosition = latest;

        // マーカー再生成
        userMarker = new google.maps.marker.AdvancedMarkerElement({
            position: userPosition,
            map,
            title: "あなたの現在地",
            content: new google.maps.marker.PinElement({
                background: "#4285F4",
                borderColor: "white",
                glyph: "●",
                glyphColor: "#4285F4",
            }).element,
        });

        // 💬 既に userCircle があっても map を再設定して描画復活
        userCircle = new google.maps.Circle({
            map,
            center: userPosition,
            radius: 50, // 仮の半径（accuracy未取得時）
            fillColor: "#4285F4",
            fillOpacity: 0.2,
            strokeColor: "#4285F4",
            strokeOpacity: 0.5,
            strokeWeight: 1,
        });
    }

    // ✅ 現在地追跡を開始
    startTracking();

    // ✅ DBに保存された報告データをロードして地図にマーカー表示
    loadReports();

    // ✅ 地図クリックで報告ダイアログを開く
    map.addListener("click", (e) => {
        openReportDialog(e.latLng);
    });
}

// ============================
// 📡 現在地追跡（watchPosition）
// ============================
function startTracking() {
    console.log("📍 startTracking() 実行");

    if (!navigator.geolocation) {
        alert("このブラウザは位置情報を取得できません。");
        return;
    }

    // 🔴 古いwatchが残っていれば一度止める
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    watchId = navigator.geolocation.watchPosition(
        async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;
            userPosition = { lat, lng };

            // ✅ 最新位置を保存（HTML側でも参照可能）
            if (window.setLatestPosition) {
                window.setLatestPosition(userPosition);
            }

            // マーカーがなければ作成、あれば更新
            if (!userMarker) {
                userMarker = new google.maps.marker.AdvancedMarkerElement({
                    position: userPosition,
                    map,
                    title: "あなたの現在地",
                    content: new google.maps.marker.PinElement({
                        background: "#4285F4",
                        borderColor: "white",
                        glyph: "●",
                        glyphColor: "#4285F4",
                    }).element,
                });
            } else {
                userMarker.position = userPosition;
            }

            // 💬 円がなければ新規作成、あれば再設定
            if (!userCircle) {
                userCircle = new google.maps.Circle({
                    map,
                    center: userPosition,
                    radius: accuracy / 16,
                    fillColor: "#4285F4",
                    fillOpacity: 0.2,
                    strokeColor: "#4285F4",
                    strokeOpacity: 0.5,
                    strokeWeight: 1,
                });
            } else {
                userCircle.setMap(map);
                userCircle.setCenter(userPosition);
                userCircle.setRadius(accuracy / 16);
            }

            // ✅ 初回のみ中心移動 (自動追尾制御を適用)
            if (!isManuallyPanning) {
                if (!map.getBounds() || !map.getBounds().contains(userPosition)) {
                    map.setCenter(userPosition);
                    map.setZoom(16);
                }
            }

            if (typeof initShelterCards === "function") {
                await initShelterCards(map, lat, lng, showRouteToShelter);
            }
        },
        (err) => {
            console.error("位置情報エラー:", err);
            alert("現在地の取得に失敗しました: " + err.message);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        }
    );
}

// ============================
// 🛑 追跡停止
// ... (変更なし) ...
// ============================
function stopTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        console.log("🛑 位置追跡を停止しました");
        watchId = null;
    }
}

// ============================
// 🚶 経路表示
// ... (変更なし) ...
// ============================
function showRouteToShelter(shelter) {
    if (!userPosition) {
        alert("現在地がまだ取得されていません。");
        return;
    }

    const request = {
        origin: userPosition,
        destination: { lat: shelter.lat, lng: shelter.lng },
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            // 既存のレンダラーを消す
            routeRenderers.forEach(r => r.setMap(null));
            routeRenderers = [];

            const colors = ["#1976D2", "#43A047", "#E53935"];

            result.routes.slice(0, 3).forEach((route, index) => {
                // ルートの座標だけ取り出す
                const path = google.maps.geometry.encoding.decodePath(route.overview_polyline);
                const polyline = new google.maps.Polyline({
                    path: path,
                    strokeColor: colors[index],
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                    map: map
                });
                routeRenderers.push(polyline);
            });
        } else {
            alert("経路を取得できませんでした: " + status);
        }
    });
}


// ============================
// 📍 現在地に戻るボタン
// ... (変更なし) ...
// ============================
function recenterMap() {
    if (userPosition && map) {
        map.panTo(userPosition);
        map.setZoom(16);
        // 💡 NEW: 現在地に戻ったら、自動追尾を再開する
        isManuallyPanning = false; 
    } else {
        alert("現在地がまだ取得されていません。");
    }
}

// ✅ 報告追加（UIでタイプ選択 + コメント入力）
// ※ この関数は report.js の submitReport にロジックを移動したため、削除推奨
// ※ 便宜上、元のコードをコメントアウト
// function addReport(lat, lng) { ... }


// ✅ DBから報告データを取得してマーカー表示（4タイプ対応）
// ... (変更なし) ...
function loadReports() {
    console.log("🟦 loadReports() 開始");

    fetch("https://hinavi.sakura.ne.jp/getReport.php")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                data.reports.forEach(rep => {
                    addReportMarker(
                        parseInt(rep.id), // 💡 ID
                        parseFloat(rep.lat),
                        parseFloat(rep.lng),
                        rep.status,
                        rep.comment,
                        rep.created_at,
                        parseInt(rep.likes_count) // 💡 likes_count
                    );
                });
            }
        })
        .catch(err => console.error("🚨 通信エラー:", err))
        .finally(() => console.log("🟫 loadReports() 完了"));
}

// ✅ 共通マーカー生成（4タイプアイコン対応 + いいね表示）
function addReportMarker(id, lat, lng, status, comment, created_at, likes_count) {
    let iconUrl;
    switch(status) {
        case "通れる": iconUrl = "img/ok.svg"; break;
        case "通れない": iconUrl = "img/ng.svg"; break;
        case "段差": iconUrl = "img/step.svg"; break;
        case "コメント": iconUrl = "img/comment.svg"; break;
        default: iconUrl = "https://maps.google.com/mapfiles/ms/icons/red-dot.png"; break;
    }

    // 1. カスタムアイコン用のDOM要素を作成 (<img> タグ)
    const iconElement = document.createElement('img');
    iconElement.src = iconUrl;
    iconElement.style.width = '32px';
    iconElement.style.height = '32px';
    
    // 2. AdvancedMarkerElement を作成
    const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat, lng },
        map,
        content: iconElement, 
        title: status
    });

    // 💡 NEW: 情報ウィンドウの内容にいいねボタンとカウントを追加
    const infoContent = `
        <div data-report-id="${id}" class="report-info-window">
            <b>${status}</b><br>
            ${comment || ""}<br>
            <small>${created_at}</small><br>
            <button class="like-btn" onclick="likeReport(${id})">👍</button>
            <span class="likes-count" id="likes-count-${id}">${likes_count || 0}</span>
        </div>
    `;

    const info = new google.maps.InfoWindow({
        content: infoContent,
    });

    marker.addListener("click", () => info.open(map, marker));
}
// ============================
// 🌐 言語変更に対応（Google Maps再読み込み）
// ============================
let currentLang = localStorage.getItem("selectedLanguage") || "ja";
let currentMapScript = null;

window.changeLanguage = function (lang) {
    console.log(`🌍 言語変更: ${lang}`);
    localStorage.setItem("selectedLanguage", lang);
    currentLang = lang;

    // 現在の位置を保持（言語切替後に再利用）
    const latestPos = userPosition || (window.getLatestPosition ? window.getLatestPosition() : null);
    if (typeof window.setLatestPosition === "function" && latestPos) {
        window.setLatestPosition(latestPos);
    }

    // 現在の追跡を停止
    if (typeof window.stopTracking === "function") stopTracking();

    // 既存のマップスクリプトを削除
    if (currentMapScript) {
        currentMapScript.remove();
        currentMapScript = null;
    }

    // 地図の中身を一旦リセット
    const mapContainer = document.getElementById("map");
    if (mapContainer) mapContainer.innerHTML = "";

    // 新しい言語でGoogle Mapsを再ロード
    const script = document.createElement("script");
    
    // 💡 修正点: '&libraries=marker' を追加
    script.src = `https://maps.googleapis.com/maps/api/js?key=${window.GOOGLE_MAPS_API_KEY}&language=${lang}&libraries=marker&callback=initMap`;
    
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    currentMapScript = script;

    // 災害情報など他のUIも即時再描画したい場合
    if (typeof window.onload === "function") window.onload();
};
// ... (初回ロード時のコードは index.html に移動済みのため削除)
