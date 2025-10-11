let map;
let directionsService;
let directionsRenderer;
let userMarker;
let userPosition = null;

function initMap() {
  const center = { lat: 34.3853, lng: 132.4553 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: center,
    zoom: 15
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

  // 現在地マーカー
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        userPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        userMarker = new google.maps.Marker({
          position: userPosition,
          map: map,
          title: "現在地",
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        });

        map.setCenter(userPosition);

        // shelters.js の関数を呼び出す
        initShelterCards(map, showRouteToShelter);
      },
      error => {
        alert("現在地が取得できませんでした。");
      }
    );
  }
}

// --- 経路描画関数 ---
function showRouteToShelter(shelter) {
  if (!userPosition) {
    alert("現在地がまだ取得されていません。");
    return;
  }

  const request = {
    origin: userPosition,
    destination: { lat: shelter.lat, lng: shelter.lng },
    travelMode: google.maps.TravelMode.WALKING
  };

  directionsService.route(request, (result, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(result);
    } else {
      alert("経路を取得できませんでした: " + status);
    }
  });
}
