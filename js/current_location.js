let map;
let userMarker;
let accuracyCircle;

function initMap() {
  // 初期位置（東京駅を仮設定）
  const defaultPosition = { lat: 35.681236, lng: 139.767125 };

  // 地図の作成
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultPosition,
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });

  // 現在地を取得してマップに反映
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        const currentLocation = { lat, lng };

        // 現在地マーカーを作成
        userMarker = new google.maps.Marker({
          position: currentLocation,
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

        // 精度を示す円を追加
        accuracyCircle = new google.maps.Circle({
          map,
          center: currentLocation,
          radius: accuracy,
          fillColor: "#4285F4",
          fillOpacity: 0.2,
          strokeColor: "#4285F4",
          strokeOpacity: 0.5,
          strokeWeight: 1,
        });

        // 現在地を中心にズーム
        map.setCenter(currentLocation);
        map.setZoom(16);
      },
      (error) => {
        console.warn("位置情報の取得に失敗:", error);
        showError(error);
      },
      {
        enableHighAccuracy: true, // できるだけ高精度
        timeout: 10000,           // タイムアウト10秒
        maximumAge: 0,            // キャッシュなし
      }
    );
  } else {
    alert("お使いのブラウザは位置情報取得に対応していません。");
  }
}

// エラー時のメッセージ表示
function showError(error) {
  let message = "";
  switch (error.code) {
    case error.PERMISSION_DENIED:
      message = "位置情報の取得が許可されていません。";
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
  const infoWindow = new google.maps.InfoWindow({
    position: map.getCenter(),
    content: `<div style="color:red; font-size:14px;">${message}</div>`,
  });
  infoWindow.open(map);
}
