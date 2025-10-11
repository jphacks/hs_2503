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
        gestureHandling: "greedy",
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

