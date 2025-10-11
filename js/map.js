let map;
let directionsService;
let directionsRenderer;
let userMarker = null;
let userCircle = null;
let userPosition = null;
let watchId = null;

async function initMap() {
    console.log("initMap() 実行");

    const defaultPos = { lat: 34.3853, lng: 132.4553 }; // 広島市
    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultPos,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map });

    if (!navigator.geolocation) {
        alert("このブラウザは位置情報を取得できません。");
        return;
    }

    // 現在地追跡
    watchId = navigator.geolocation.watchPosition(
        async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;
            userPosition = { lat, lng };

            // === 初回のみ ===
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

                // ✅ 初回のみ中心を設定
                map.setCenter(userPosition);
                map.setZoom(16);

                if (typeof initShelterCards === "function") {
                    await initShelterCards(map, lat, lng, showRouteToShelter);
                }
            } else {
                // ✅ マーカーと円だけ動かす（地図は動かさない）
                userMarker.setPosition(userPosition);
                userCircle.setCenter(userPosition);
                userCircle.setRadius(accuracy / 16);
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


    // ✅ DBに保存された報告データをロードして地図にマーカー表示
    loadReports();

    // 地図クリックで報告ダイアログを開く
    map.addListener("click", (e) => {
    openReportDialog(e.latLng);
    });

}

// 🚶 経路表示
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

// 📍 現在地に戻るボタン
function recenterMap() {
    if (userPosition && map) {
        map.panTo(userPosition); // ← ボタン押下時のみ中心に戻す
        map.setZoom(16);
    } else {
        alert("現在地がまだ取得されていません。");
    }
}

// 🔴 追跡停止（任意）
function stopTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        console.log("位置追跡を停止しました");
    }
}

// 手動で追従を再開
function recenterMap() {
    if (userPosition && map) {
        map.panTo(userPosition);
        isFollowing = true;
        console.log("現在地追従を再開");
    }
}
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
            // ✅ 送信直後にマーカー追加
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

// ✅ DBから報告データを取得してマーカーを地図に表示する
function loadReports() {
    console.log("🟦 loadReports() 開始");

    fetch("https://hinavi.sakura.ne.jp/getReport.php")
        .then(res => {
        console.log("🟨 レスポンス受信:", res.status);
        return res.json();
        })
        .then(data => {
        console.log("🟩 サーバーからのデータ:", data);

        if (data.success) {
            if (data.reports.length === 0) {
            console.warn("⚠️ 報告データが空です");
            }

            data.reports.forEach(rep => {
            console.log(`📍 マーカー作成: (${rep.lat}, ${rep.lng}) 状態=${rep.status}`);

            const iconUrl = rep.status === "通れる" ? "img/ok.svg" : "img/ng.svg";

            const marker = new google.maps.Marker({
            position: { lat: parseFloat(rep.lat), lng: parseFloat(rep.lng) },
            map: map,
            icon: {
                url: iconUrl,
                scaledSize: new google.maps.Size(24, 24), // 幅24px × 高さ24pxに縮小
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(12, 24)     // ピン先端を座標に合わせる
            }
            });


            const info = new google.maps.InfoWindow({
                content: `<b>${rep.status}</b><br>${rep.comment || ""}<br><small>${rep.created_at}</small>`,
            });

            marker.addListener("click", () => info.open(map, marker));
            });
        } else {
            console.error("❌ データ取得に失敗:", data.error);
        }
        })
        .catch(err => {
        console.error("🚨 通信エラー:", err);
        })
        .finally(() => {
        console.log("🟫 loadReports() 完了");
        });
}



// ============================
// ✅ マーカー生成関数（共通）
// ============================
function addReportMarker(lat, lng, status, comment, created_at) {
    const iconUrl =
        status === "通れる"
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


