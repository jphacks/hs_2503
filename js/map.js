let map;
let directionsService;
let directionsRenderer;
let userMarker = null;
let userCircle = null;

function initMap() {
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

  // 経路描画用のサービス設定
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  // === 避難所マーカーの表示 ===
  if (typeof shelters !== "undefined" && shelters.length > 0) {
    shelters.forEach((shelter) => {
      new google.maps.Marker({
        position: { lat: shelter.lat, lng: shelter.lng },
        map: map,
        title: shelter.name,
        icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
      });
    });
  }

  // === カード作成関数（別JSで定義されている想定） ===
  if (typeof createShelterCards === "function") {
    createShelterCards(startWalkingNavigation);
  }

  // === 現在地を取得して地図の中心に設定 ===
  if (!navigator.geolocation) {
    alert("このブラウザは位置情報を取得できません。");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      console.log("現在地取得成功:", pos.coords);

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;
      const currentPos = { lat, lng };

      // 現在地を中心に移動
      map.setCenter(currentPos);
      map.setZoom(16);

      // 現在地マーカー（青い丸）
      userMarker = new google.maps.Marker({
        position: currentPos,
        map,
        title: "あなたの現在地",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 2,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
      });

      // 精度円
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

