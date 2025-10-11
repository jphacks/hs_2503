let map;
let userMarker = null;
let userCircle = null;
let watchId = null;

function initMap() {
  // 初期位置（東京駅を仮設定）
  const defaultPosition = { lat: 35.681236, lng: 139.767125 };

  // 地図を初期化
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultPosition,
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });

  // Geolocation APIが利用可能か確認
  if (!navigator.geolocation) {
    alert("このブラウザは位置情報取得に対応していません。");
    return;
  }

  // 現在地をリアルタイム追跡
  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      const currentPos = { lat, lng };

      // 既存マーカーがあれば削除
      if (userMarker) userMarker.setMap(null);
      if (userCircle) userCircle.setMap(null);

      // 現在地マーカー（青い点）
      userMarker = new google.maps.Marker({
        position: currentPos,
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

      // 精度範囲の青い円
      userCircle = new google.maps.Circle({
        map,
        center: currentPos,
        radius: accuracy,
        fillColor: "#4285F4",
        fillOpacity: 0.2,
        strokeColor: "#4285F4",
        strokeOpacity: 0.5,
        strokeWeight: 1,
      });

      // 現在地を中心に移動
      map.setCenter(currentPos);
      map.setZoom(16);
    },
    (error) => {
      console.error("位置情報の取得に失敗:", error);
      showError(error);
    },
    {
      enableHighAccuracy: true, // 高精度で取得
      maximumAge: 0,            // キャッシュを使わない
      timeout: 10000,           // タイムアウト10秒
    }
  );
}

// エラー処理
function showError(error) {
  let message;
  switch (error.code) {
    case error.PERMISSION_DENIED:
      message = "位置情報の取得が拒否されました。";
      break;
    case error.POSITION_UNAVAILABLE:
      message = "位置情報を取得できませんでした。";
      break;
    case error.TIMEOUT:
      message = "位置情報の取得がタイムアウトしました。";
      break;
    default:
      message = "不明なエラーが発生しました。";
  }
  alert(message);
}
