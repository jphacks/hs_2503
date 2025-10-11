let map;
let directionsService;
let directionsRenderer;
let userMarker = null;
let userCircle = null;
let watchId = null;

/* -----------------------------
   ① 避難所マップ初期化
----------------------------- */
function init_map() {
  const center = { lat: 34.3853, lng: 132.4553 }; // 広島駅あたり
  map = new google.maps.Map(document.getElementById("map"), {
    center: center,
    zoom: 16,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

  // 避難所マーカー配置
  if (typeof shelters !== "undefined") {
    shelters.forEach((shelter) => {
      new google.maps.Marker({
        position: { lat: shelter.lat, lng: shelter.lng },
        map: map,
        title: shelter.name,
        icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
      });
    });
  }

  // カード作成（別JS関数を呼ぶ想定）
  if (typeof createShelterCards === "function") {
    createShelterCards(startWalkingNavigation);
  }
}

/* -----------------------------
   ② 現在地リアルタイム追跡
----------------------------- */
function initMap_current_location() {
  if (!navigator.geolocation) {
    alert("このブラウザは位置情報取得に対応していません。");
    return;
  }

  // watchPositionでリアルタイム追跡
  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      const currentPos = { lat, lng };

      // 既存マーカー削除
      if (userMarker) userMarker.setMap(null);
      if (userCircle) userCircle.setMap(null);

      // 現在地マーカー（青点）
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

      // 精度範囲を示す円
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

      // 初回 or 大きく移動したら中心に移動
      map.setCenter(currentPos);
    },
    (error) => {
      console.error("位置情報の取得に失敗:", error);
      showError(error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  );
}

/* -----------------------------
   ③ 両方まとめて初期化（Google Mapsのcallbackで呼ばれる）
----------------------------- */
function initMap_all() {
  init_map(); // 避難所マップ
  initMap_current_location(); // 現在地追跡
}

/* -----------------------------
   ④ エラー処理
----------------------------- */
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
