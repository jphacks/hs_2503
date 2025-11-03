// map.js
// ============================
// 🌏 グローバル変数
// ============================
let map;
let directionsService;
let directionsRenderer; // ※ 実際には使用していませんが、定義は残します
let userMarker = null; // AdvancedMarkerElement に変わる
let userCircle = null;
let userPosition = null;
let watchId = null;
let routeRenderers = [];
let isManuallyPanning = false; // 💡 NEW: ユーザーが手動で地図を動かしたか
let reportMarkers = []; // レポートマーカーを保持する配列を追加 (言語切替のため)

// 💡 NEW: 避難所連携用の位置情報更新関数をグローバルに公開
// shelters.jsが定義する global.setSheltersPosition を呼び出す
function updateSheltersPosition(pos) {
    // shelters.js で定義された関数を呼び出し、現在地を通知
    if (typeof window.setSheltersPosition === "function") {
        window.setSheltersPosition(pos);
    }
}

// ✅ 外部（HTML側）から呼べるように公開
window.initMap = initMap;
window.stopTracking = stopTracking;
window.recenterMap = recenterMap; // HTML側から呼び出せるように公開


// ============================
// 🗺️ 初期化
// ============================
async function initMap() {
    console.log("🗺️ initMap() 実行");

    // ✅ 最新の位置情報があれば利用 (initial.jsが管理)
    const latest = window.getLatestPosition ? window.getLatestPosition() : null;
    // 💡 修正: 初期値の緯度経度を設定（例: 東広島）
    const defaultPos = latest || { lat: 34.3948, lng: 132.7483 }; 

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

    // 💡 NEW: 地図ドラッグ開始時にフラグを立てる (自動追尾制御)
    map.addListener("dragstart", () => {
        console.log("🗺️ 手動操作開始: 自動追尾を一時停止");
        isManuallyPanning = true;
    });
    
    // 💬 言語切替直後にも現在地と仮の円を描画
    if (latest) {
        console.log("🟦 最新位置から仮マーカーと円を描画");
        userPosition = latest;
        drawUserLocation(latest, map); // 描画処理を関数化

        // 💡 修正: shelters.js にも最新位置情報を通知 (初期距離計算のため)
        updateSheltersPosition(latest);
    }

    // ✅ 現在地追跡を開始
    startTracking();

    // ✅ DBに保存された報告データをロードして地図にマーカー表示
    loadReports();

    // ✅ 地図クリックで報告ダイアログを開く
    map.addListener("click", (e) => {
        // openReportDialog が他ファイルで定義されていると仮定
        if (typeof openReportDialog === "function") {
            openReportDialog(e.latLng);
        }
    });
    
    // 🌟 修正: 地図イベントリスナーの設定 (shelters.jsが提供する setupMapListeners を呼び出す)
    if (typeof setupMapListeners === "function") {
        console.log("🌟 setupMapListeners() 呼び出し");
        // defaultPosにはaccuracy情報がない場合があるため、初期値としてはlat/lngのみでOK
        setupMapListeners(map, defaultPos.lat, defaultPos.lng, showRouteToShelter);
    } else {
        console.error("🚨 エラー: setupMapListeners関数が定義されていません。shelters.jsが正しく読み込まれているか確認してください。");
    }
}

/**
 * ユーザーの位置マーカーと円を描画/更新するヘルパー関数
 * @param {object} pos - { lat, lng, accuracy }
 * @param {google.maps.Map} mapInstance - マップインスタンス
 */
function drawUserLocation(pos, mapInstance) {
    // マーカーがなければ作成、あれば更新
    if (!userMarker) {
        userMarker = new google.maps.marker.AdvancedMarkerElement({
            position: pos,
            map: mapInstance,
            title: "あなたの現在地",
            content: new google.maps.marker.PinElement({
                background: "#4285F4",
                borderColor: "white",
                glyph: "●",
                glyphColor: "#4285F4",
            }).element,
        });
    } else {
        userMarker.position = pos;
        userMarker.map = mapInstance; 
    }

    // 💬 円がなければ新規作成、あれば再設定
    if (!userCircle) {
        userCircle = new google.maps.Circle({
            map: mapInstance,
            center: pos,
            radius: pos.accuracy || 50, // 💡 精度(メートル)を設定
            fillColor: "#4285F4",
            fillOpacity: 0.2,
            strokeColor: "#4285F4",
            strokeOpacity: 0.5,
            strokeWeight: 1,
        });
    } else {
        userCircle.setCenter(pos);
        userCircle.setRadius(pos.accuracy || 50);
        userCircle.setMap(mapInstance); 
    }
}


// ============================
// 📡 現在地追跡（watchPosition）
// ============================
function startTracking() {
    console.log("📍 startTracking() 実行");

    if (!navigator.geolocation) {
        // カスタムUIでのメッセージボックスの使用を推奨
        const messageBox = document.getElementById('message-box');
        if (messageBox) messageBox.textContent = "このブラウザは位置情報を取得できません。";
        else console.error("このブラウザは位置情報を取得できません。");
        return;
    }

    // 🔴 古いwatchが残っていれば一度止める
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;
            
            // 💡 修正: userPosition に accuracy も保持
            const newPosition = { lat, lng, accuracy };
            userPosition = newPosition;

            // ✅ 最新位置を保存（HTML側でも参照可能）
            if (window.setLatestPosition) {
                window.setLatestPosition(newPosition);
            }
            
            // 💡 NEW: shelters.js に最新位置情報を通知 (距離計算と再ロードのため)
            updateSheltersPosition(newPosition);

            // マーカーと円の描画/更新
            drawUserLocation(newPosition, map);

            // ✅ 初回のみ中心移動 (自動追尾制御を適用)
            if (!isManuallyPanning) {
                if (!map.getBounds() || !map.getBounds().contains(newPosition)) {
                    map.setCenter(newPosition);
                    map.setZoom(16);
                }
            }
        },
        (err) => {
            console.error("位置情報エラー:", err);
            // エラーを通知（カスタムUIを推奨）
            const messageBox = document.getElementById('message-box');
            if (messageBox) messageBox.textContent = "現在地の取得に失敗しました: " + err.message;
            else console.error("現在地の取得に失敗しました: " + err.message);
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
// ============================
function showRouteToShelter(shelter) {
    if (!userPosition) {
        // 現在地取得失敗時の代替メッセージ
        const messageBox = document.getElementById('message-box');
        if (messageBox) messageBox.textContent = "現在地がまだ取得されていません。";
        else console.warn("現在地がまだ取得されていません。");
        return;
    }
    
    // 💡 修正点: 既存のレンダラー（Polyline）を消す
    routeRenderers.forEach(r => r.setMap(null));
    routeRenderers = [];

    const request = {
        origin: userPosition,
        destination: { lat: shelter.lat, lng: shelter.lng },
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            
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
            // エラーを通知（カスタムUIを推奨）
            const messageBox = document.getElementById('message-box');
            const errorMessage = "経路を取得できませんでした: " + status;
            if (messageBox) messageBox.textContent = errorMessage;
            else console.error(errorMessage);
        }
    });
}


// ============================
// 📍 現在地に戻るボタン
// ============================
function recenterMap() {
    if (userPosition && map) {
        map.panTo(userPosition);
        map.setZoom(16);
        // 💡 NEW: 現在地に戻ったら、自動追尾を再開する
        isManuallyPanning = false; 
    } else {
        // エラーを通知（カスタムUIを推奨）
        const messageBox = document.getElementById('message-box');
        const errorMessage = "現在地がまだ取得されていません。";
        if (messageBox) messageBox.textContent = errorMessage;
        else console.warn(errorMessage);
    }
}

// ============================
// ✅ DBから報告データを取得してマーカー表示（4タイプ対応）
// ============================
function loadReports() {
    console.log("🟦 loadReports() 開始");
    
    // 💡 修正点: 言語切り替えや再ロードに備えて、既存のマーカーを削除
    reportMarkers.forEach(marker => {
        marker.setMap(null);
        google.maps.event.clearInstanceListeners(marker);
    });
    reportMarkers = []; // 配列をリセット

    // NOTE: レポート取得APIは変更なしと仮定
    fetch("https://hinavi.sakura.ne.jp/php/getReport.php")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                data.reports.forEach(rep => {
                    const likesCount = parseInt(rep.likes_count) || 0;
                    const dislikesCount = parseInt(rep.dislikes_count) || 0;
                    
                    addReportMarker(
                        parseInt(rep.id),
                        parseFloat(rep.lat),
                        parseFloat(rep.lng),
                        rep.status,
                        rep.comment,
                        rep.created_at,
                        likesCount,    
                        dislikesCount  
                    );
                });
            }
        })
        .catch(err => console.error("🚨 通信エラー:", err))
        .finally(() => console.log("🟫 loadReports() 完了"));
}

// ============================
// ✅ 共通マーカー生成（4タイプアイコン対応 + いいね表示）
// ============================
function addReportMarker(id, lat, lng, status, comment, created_at, likesCount, dislikesCount) {
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
    
    // 💡 修正点: マーカーを配列に追加
    reportMarkers.push(marker);

    // 💡 情報ウィンドウの内容に Good/Bad ボタンとカウントを追加
    const infoContent = `
        <div data-report-id="${id}" class="report-info-window">
            <b>${status}</b><br>
            ${comment || ""}<br>
            <small>${created_at}</small><br>
            
            <div class="evaluation-container" style="display:flex; gap:10px; margin-top: 8px;">

                <div class="like-group">
                    <button class="good-btn" onclick="sendEvaluation(${id}, 'good')">
                        👍 役立った
                    </button>
                    <span class="count-badge" id="likes-count-${id}">${likesCount || 0}</span>
                </div>
                
                <div class="dislike-group">
                    <button class="bad-btn" onclick="sendEvaluation(${id}, 'bad')">
                        👎 役に立たない
                    </button>
                    <span class="count-badge" id="dislikes-count-${id}">${dislikesCount || 0}</span>
                </div>
            </div>
            
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
    
    // 💡 修正点: 既存の全AdvancedMarkerElementとCircleをクリア
    if (userMarker) userMarker.setMap(null);
    if (userCircle) userCircle.setMap(null);
    
    // 経路もクリア
    routeRenderers.forEach(r => r.setMap(null));
    routeRenderers = [];

    // レポートマーカーもクリア
    reportMarkers.forEach(m => m.setMap(null));
    reportMarkers = [];

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
