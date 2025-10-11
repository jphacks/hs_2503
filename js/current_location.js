let map;
let userMarker;
let userCircle;

function initMap() {
  // 地図を初期化（デフォルトは東京駅）
  const defaultPos = { lat: 35.681236, lng: 139.767125 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultPos,
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });

  // 現在地を取得
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        const currentPos = { lat, lng };

        // 現在地マーカーを追加
        userMarker = new google.maps.Marker({
          position: currentPos,
          map: map,
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

        // 精度を示す円を追加
        userCircle = new google.maps.Circle({
          center: currentPos,
          radius: accuracy,
          map: map,
          fillColor: "#4285F4",
          fillOpacity: 0.15,
          strokeColor: "#4285F4",
          strokeOpacity: 0.3,
          strokeWeight: 1,
        });

        // 地図を現在地に移動
        map.setCenter(currentPos);
        map.setZoom(16);
      },
      (error) => {
        console.warn("位置情報取得に失敗:", error);
        handleLocationError(true, map.getCenter());
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  } else {
    // Geolocation API非対応
    handleLocationError(false, map.getCenter());
  }
}

// エラー処理関数
function handleLocationError(browserHasGeolocation, pos) {
  const message = browserHasGeolocation
    ? "位置情報を取得できませんでした。ブラウザの設定を確認してください。"
    : "お使いのブラウザは位置情報取得に対応していません。";

  const infoWindow = new google.maps.InfoWindow({
    position: pos,
    content: `<div style="color:red; font-size:14px;">${message}</div>`,
  });
  infoWindow.open(map);
}
