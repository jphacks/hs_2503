let map;
let directionsService;
let directionsRenderer;
let userMarker = null;
let userCircle = null;
let userPosition = null; // ← 現在地を保持

async function initMap() {
    console.log("initMap() 実行");

    // 仮の初期位置（広島市）
    const defaultPos = { lat: 34.3853, lng: 132.4553 };

    // 地図を初期化
    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultPos,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
    });

    // 経路描画用のサービス
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map });

    // 現在地を取得
    if (!navigator.geolocation) {
        alert("このブラウザは位置情報を取得できません。");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;
            userPosition = { lat, lng };

            // map.setCenter(userPosition);
            // map.setZoom(16);

            // 現在地マーカー
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

            // 精度円
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

            // --- shelters の読み込みとカード・マーカー表示 ---
            // shelter.js の関数を呼ぶ
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
