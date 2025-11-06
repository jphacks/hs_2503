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
let isManuallyPanning = false; // 💡 ユーザーが手動で地図を動かしたか
let reportMarkers = []; // レポートマーカーを保持する配列

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
window.recenterMap = recenterMap; 
window.loadReports = loadReports; // report.jsから再ロードするために公開

// ============================
// 🗺️ 初期化
// ============================
async function initMap() {
    console.log("🗺️ initMap() 実行");

    // 💡 NEW: タイムアウト対応として、高精度ではない getCurrentPosition を一度試みる
    let initialPos = await getInitialPosition(); // 非同期で初期位置を待機
    
    // ✅ 最新の位置情報があれば利用 (initial.jsが管理)
    const latest = window.getLatestPosition ? window.getLatestPosition() : null;
    
    // 💡 取得した初期位置を最優先で使用。次にキャッシュ、最後にデフォルト位置。
    const defaultPos = initialPos || latest || { lat: 34.3948, lng: 132.7483 }; 

    // 新しい地図を生成
    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultPos,
        zoom: 15,
        mapId: '58be1157ad609efe356c49f6', 

        // --- 全UIを一括で消すなら ---
        disableDefaultUI: true,

        gestureHandling: "greedy"
    });

    directionsService = new google.maps.DirectionsService();

    // 💡 NEW: 地図ドラッグ開始時にフラグを立てる (自動追尾制御)
    map.addListener("dragstart", () => {
        console.log("🗺️ 手動操作開始: 自動追尾を一時停止");
        isManuallyPanning = true;
    });
    
    // 💬 初期位置から現在地と円を描画し、避難所データ更新を行う
    if (defaultPos !== { lat: 34.3948, lng: 132.7483 }) {
        console.log("🟦 初期位置から仮マーカーと円を描画");
        userPosition = defaultPos; // 取得した位置を userPosition に設定
        drawUserLocation(defaultPos, map); // 描画処理を関数化

        // 💡 修正: shelters.js にも最新位置情報を通知 (初期距離計算のため)
        updateSheltersPosition(defaultPos);
    }
    // 言語切替直後にも現在地と仮の円を描画
    if (latest) {
        console.log("🟦 最新位置から仮マーカーと円を描画");
        userPosition = latest;
        drawUserLocation(latest, map);
        // shelters.js にも最新位置情報を通知 (初期距離計算のため)
        updateSheltersPosition(latest);
    }

    // ✅ 現在地追跡を開始 (watchPositionによる継続的な追跡)
    startTracking();

    // ✅ DBに保存された報告データをロードして地図にマーカー表示
    loadReports();

    // ✅ 地図クリックで報告ダイアログを開く
    map.addListener("click", (e) => {
        // openReportDialog が他ファイルで定義されていると仮定 (report.js)
        if (typeof openReportDialog === "function") {
            openReportDialog(e.latLng);
        }
    });
    
    // 🌟 修正: 地図イベントリスナーの設定 (shelters.jsが提供する setupMapListeners を呼び出す)
    if (typeof setupMapListeners === "function") {
        console.log("🌟 setupMapListeners() 呼び出し");
        setupMapListeners(map, defaultPos.lat, defaultPos.lng, showRouteToShelter);
    } else {
        console.error("🚨 エラー: setupMapListeners関数が定義されていません。shelters.jsが正しく読み込まれているか確認してください。");
    }

    const recenterBtn = document.getElementById("recenter-btn");
    if (recenterBtn) {
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(recenterBtn);
    }
}

/**
 * 💡 NEW: 現在地を一度だけ取得し、成功またはタイムアウトするまで待機する関数
 * @returns {Promise<object | null>} { lat, lng, accuracy } または null
 */
function getInitialPosition() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        const options = {
            enableHighAccuracy: false, // 高精度不要
            timeout: 10000, // 10秒でタイムアウト
            maximumAge: 0,
        };

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log("📍 初期位置を getCurrentPosition で取得成功");
                resolve({ 
                    lat: pos.coords.latitude, 
                    lng: pos.coords.longitude, 
                    accuracy: pos.coords.accuracy 
                });
            },
            (err) => {
                // タイムアウトや権限エラーでも、地図の初期化をブロックしない
                console.warn(`⚠️ 初期位置取得失敗 (Code: ${err.code}): ${err.message}`);
                resolve(null);
            },
            options
        );
    });
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
                glyphText: "●",
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
            clickable: false,
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

    // 💡 修正: ここから watchPosition の呼び出しを開始
    watchId = navigator.geolocation.watchPosition(
        // 成功時の処理 (pos)
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;
            
            // 💡 userPosition に accuracy も保持
            const newPosition = { lat, lng, accuracy };
            userPosition = newPosition;

            // ✅ 最新位置を保存（HTML側でも参照可能）
            if (window.setLatestPosition) {
                window.setLatestPosition(newPosition);
            }
            
            // 💡 shelters.js に最新位置情報を通知
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
        // エラー時の処理 (err)
        (err) => {
            console.error("位置情報エラー:", err);
            
            let errorMessage = "現在地の取得に失敗しました: " + err.message;
            
            // 💡 エラーコード2と3の場合、より具体的なメッセージを提示
            if (err.code === 2) { 
                // Position update is unavailable
                errorMessage = "位置情報サービスが利用できません。スマートフォンの設定で、このサイト（またはブラウザアプリ）への位置情報アクセスが許可されているか確認してください。";
            } else if (err.code === 3) {
                // Timeout expired
                errorMessage = "位置情報取得がタイムアウトしました。屋外で再試行するか、設定を確認してください。";
            }
            
            // エラーを通知
            const messageBox = document.getElementById('message-box');
            if (messageBox) messageBox.textContent = errorMessage;
            else console.error(errorMessage);
        },
        // オプション
        {
            // ✅ 修正点1: 高精度要求をfalseに設定し、低精度でも成功しやすくする
            enableHighAccuracy: false, 
            
            // ✅ 修正点2: タイムアウトを延長し、取得の猶予時間を増やす
            timeout: 30000, // 30秒に延長

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
        const messageBox = document.getElementById('message-box');
        if (messageBox) messageBox.textContent = "現在地がまだ取得されていません。";
        else console.warn("現在地がまだ取得されていません。");
        return;
    }
    
    // 💡 既存のレンダラー（Polyline）を消す
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
    
    // 既存のマーカーを削除
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
                    
                    // 💡 【修正点】：addReportMarker 関数に rep.user_name を渡す
                    addReportMarker(
                        parseInt(rep.id),
                        parseFloat(rep.lat),
                        parseFloat(rep.lng),
                        rep.status,
                        rep.comment,
                        rep.created_at,
                        likesCount,    
                        dislikesCount,
                        rep.user_name  // ✅ 投稿者名を追加
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
// 💡 【修正点】：引数に userName を追加
function addReportMarker(id, lat, lng, status, comment, created_at, likesCount, dislikesCount, userName) { 
    let iconUrl;
    switch(status) {
        case "通れる": iconUrl = "img/ok.svg"; break;
        case "通れない": iconUrl = "img/ng.svg"; break;
        case "段差": iconUrl = "img/step.svg"; break;
        case "コメント": iconUrl = "img/comment.svg"; break;
        default: iconUrl = "https://maps.google.com/mapfiles/ms/icons/red-dot.png"; break;
    }

    // 1. カスタムアイコン用のDOM要素を作成
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
    
    reportMarkers.push(marker);

// ... (前略) ...

    // 💡 投稿者名の表示を準備
    const postUserName = userName || "匿名ユーザー";

    // 💡 【修正】：情報ウィンドウの内容からユーザーアイコン画像を削除
    const infoContent = `
        <div data-report-id="${id}" class="sns-info-card">
            
            <div class="card-header">
                <div class="user-profile">
                    
                    <span class="user-name">${postUserName}</span>
                </div>
                <span class="post-time">${created_at}</span>
            </div>
            
            <div class="card-body">
                <div class="status-indicator status-${status === '通れる' ? 'pass' : status === '通れない' ? 'fail' : status === '段差' ? 'step' : 'comment'}">
                    <span class="status-text">${status}</span>
                </div>
                <p class="comment-content">${comment || "コメントはありません"}</p>
            </div>
            
            <div class="card-footer">
                <div class="evaluation-actions">
                    <button class="action-btn good-action" onclick="window.sendEvaluation(${id}, 'good')">
                        👍 役立った <span id="likes-count-${id}">${likesCount || 0}</span>
                    </button>
                    <button class="action-btn bad-action" onclick="window.sendEvaluation(${id}, 'bad')">
                        👎 役に立たない <span id="dislikes-count-${id}">${dislikesCount || 0}</span>
                    </button>
                </div>
            </div>
            
        </div>
    `;

    const info = new google.maps.InfoWindow({
        content: infoContent,
        pixelOffset: new google.maps.Size(0, -30) // マーカーの少し上に調整
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
    
    // 既存の全AdvancedMarkerElementとCircleをクリア
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
    
    // 💡 '&libraries=marker' を追加
    script.src = `https://maps.googleapis.com/maps/api/js?key=${window.GOOGLE_MAPS_API_KEY}&language=${lang}&libraries=marker&callback=initMap`;
    
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    currentMapScript = script;

    // 災害情報など他のUIも即時再描画したい場合
    if (typeof window.onload === "function") window.onload();
};