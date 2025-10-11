let map;
let directionsService;
let directionsRenderer;
let userMarker = null;
let userCircle = null;
let userPosition = null;
let watchId = null;
let isFollowing = true; // ← 現在地追従フラグ

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

    // 地図をドラッグしたら追従を一時停止
    map.addListener("dragstart", () => {
        isFollowing = false;
        console.log("地図ドラッグ検知 → 追従停止");
    });

    // 現在地追跡開始
    if (!navigator.geolocation) {
        alert("このブラウザは位置情報を取得できません。");
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;
            userPosition = { lat, lng };

            if (!userMarker) {
                // 初回：マーカーと円を作成
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

                map.setCenter(userPosition);
                map.setZoom(16);

                // 避難所カードの初期化
                if (typeof initShelterCards === "function") {
                    await initShelterCards(map, lat, lng, showRouteToShelter);
                }
            } else {
                // 位置を更新
                userMarker.setPosition(userPosition);
                userCircle.setCenter(userPosition);
                userCircle.setRadius(accuracy / 16);
            }

            // 追従ONのときは中心を更新
            if (isFollowing) {
                map.panTo(userPosition);
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

// 経路表示
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

// 追跡停止
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
