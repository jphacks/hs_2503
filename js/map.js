// ============================
// 🌏 グローバル変数
// ============================
let map;
let directionsService;
let directionsRenderer;
let userMarker = null;
let userCircle = null;
let userPosition = null;
let watchId = null;
let routeRenderers = [];
let routeButtons = [];

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
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map });

    // 💬 言語切替直後にも現在地と仮の円を描画
    if (latest) {
        console.log("🟦 最新位置から仮マーカーと円を描画");
        userPosition = latest;

        // マーカー再生成
        userMarker = new google.maps.Marker({
            position: userPosition,
            map,
            title: "あなたの現在地",
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
            },
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

            // マーカーがなければ作成
            if (!userMarker) {
                userMarker = new google.maps.Marker({
                    position: userPosition,
                    map,
                    title: "あなたの現在地",
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeColor: "white",
                        strokeWeight: 2,
                    },
                });
            } else {
                userMarker.setPosition(userPosition);
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
                // 言語切替後、mapが変わるため map を再指定して強制再描画
                userCircle.setMap(map);
                userCircle.setCenter(userPosition);
                userCircle.setRadius(accuracy / 16);
            }

            // ✅ 初回のみ中心移動
            if (!map.getBounds() || !map.getBounds().contains(userPosition)) {
                map.setCenter(userPosition);
                map.setZoom(16);
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
// ============================
function recenterMap() {
    if (userPosition && map) {
        map.panTo(userPosition);
        map.setZoom(16);
    } else {
        alert("現在地がまだ取得されていません。");
    }
}

// ✅ 報告追加（UIでタイプ選択 + コメント入力）
function addReport(lat, lng) {
    // ラジオボタンで選択（HTML側で用意）
    const statusRadio = document.querySelector('input[name="status"]:checked');
    if (!statusRadio) {
        alert("コメントタイプを選んでください");
        return;
    }
    const statusValue = statusRadio.value; // pass / fail / step / comment
    const comment = document.getElementById("comment").value;

    // ステータスラベルとアイコン
    let readableStatus;
    switch(statusValue) {
        case "pass": readableStatus = "通れる"; break;
        case "fail": readableStatus = "通れない"; break;
        case "step": readableStatus = "段差"; break;
        case "comment": readableStatus = "コメント"; break;
        default: readableStatus = statusValue; break;
    }

    const payload = {
        lat,
        lng,
        status: readableStatus,
        comment
    };

    console.log("送信データ:", payload);

    fetch("https://hinavi.sakura.ne.jp/sendReport.php", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload)
    })
    .then(async res => {
        const text = await res.text();
        console.log("サーバー応答:", text);
        return JSON.parse(text);
    })
    .then(data => {
        if (data.success) {
            alert("報告を送信しました！");
            addReportMarker(lat, lng, readableStatus, comment, new Date().toLocaleString());
        } else {
            alert("送信に失敗しました: " + (data.error || "原因不明"));
        }
    })
    .catch(err => {
        console.error("送信エラー:", err);
        alert("通信エラー: " + err.message);
    });
}

// ✅ DBから報告データを取得してマーカー表示（4タイプ対応）
function loadReports() {
    console.log("🟦 loadReports() 開始");

    fetch("https://hinavi.sakura.ne.jp/getReport.php")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                data.reports.forEach(rep => {
                    addReportMarker(
                        parseFloat(rep.lat),
                        parseFloat(rep.lng),
                        rep.status,
                        rep.comment,
                        rep.created_at
                    );
                });
            }
        })
        .catch(err => console.error("🚨 通信エラー:", err))
        .finally(() => console.log("🟫 loadReports() 完了"));
}

// ✅ 共通マーカー生成（4タイプアイコン対応）
function addReportMarker(lat, lng, status, comment, created_at) {
    let iconUrl;
    switch(status) {
        case "通れる": iconUrl = "img/ok.svg"; break;
        case "通れない": iconUrl = "img/ng.svg"; break;
        case "段差": iconUrl = "img/step.svg"; break;
        case "コメント": iconUrl = "img/comment.svg"; break;
        default: iconUrl = "https://maps.google.com/mapfiles/ms/icons/red-dot.png"; break;
    }

    const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        icon: iconUrl
    });

    const info = new google.maps.InfoWindow({
        content: `<b>${status}</b><br>${comment || ""}<br><small>${created_at}</small>`,
    });

    marker.addListener("click", () => info.open(map, marker));
}
