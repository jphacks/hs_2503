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
        gestureHandling: "greedy"//
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
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
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

// ============================
// 💬 報告関連関数（変更なし）
// ============================
function addReport(lat, lng) {
    const status = prompt("この道は通れますか？（通れる or 通れない）");
    const comment = prompt("コメントを入力してください（任意）");

    if (!status) return;

    const payload = { lat, lng, status, comment };
    console.log("送信データ:", payload);

    fetch("https://hinavi.sakura.ne.jp/sendReport.php", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
    })
        .then(async (res) => {
            const text = await res.text();
            console.log("サーバー応答:", text);
            return JSON.parse(text);
        })
        .then((data) => {
            if (data.success) {
                alert("報告を送信しました！");
                addReportMarker(lat, lng, status, comment, new Date().toLocaleString());
            } else {
                alert("送信に失敗しました: " + (data.error || "原因不明"));
            }
        })
        .catch((err) => {
            console.error("送信エラー:", err);
            alert("通信エラー: " + err.message);
        });
}

// ✅ DBから報告データを取得してマーカーを地図に表示
function loadReports() {
    console.log("🟦 loadReports() 開始");

    fetch("https://hinavi.sakura.ne.jp/getReport.php")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                data.reports.forEach(rep => {
                    const iconUrl = rep.status === "通れる" ? "img/ok.svg" : "img/ng.svg";
                    const marker = new google.maps.Marker({
                        position: { lat: parseFloat(rep.lat), lng: parseFloat(rep.lng) },
                        map: map,
                        icon: {
                            url: iconUrl,
                            scaledSize: new google.maps.Size(24, 24),
                            anchor: new google.maps.Point(12, 24)
                        }
                    });

                    const info = new google.maps.InfoWindow({
                        content: `<b>${rep.status}</b><br>${rep.comment || ""}<br><small>${rep.created_at}</small>`,
                    });

                    marker.addListener("click", () => info.open(map, marker));
                });
            }
        })
        .catch(err => console.error("🚨 通信エラー:", err))
        .finally(() => console.log("🟫 loadReports() 完了"));
}

// ✅ 共通マーカー生成
function addReportMarker(lat, lng, status, comment, created_at) {
    const iconUrl = status === "通れる"
        ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
        : "https://maps.google.com/mapfiles/ms/icons/red-dot.png";

    const marker = new google.maps.Marker({
        position: { lat: parseFloat(lat), lng: parseFloat(lng) },
        map,
        icon: iconUrl,
    });

    const info = new google.maps.InfoWindow({
        content: `<b>${status}</b><br>${comment || ""}<br><small>${created_at}</small>`,
    });

    marker.addListener("click", () => info.open(map, marker));
}