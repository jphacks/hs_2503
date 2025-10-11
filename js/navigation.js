let watchId;
let userMarker;

function startWalkingNavigation(shelter) {
  if (!navigator.geolocation) {
    alert('このブラウザは位置情報をサポートしていません。');
    return;
  }

  // 既存の追跡を解除
  if (watchId) navigator.geolocation.clearWatch(watchId);

  watchId = navigator.geolocation.watchPosition(
    position => {
      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // 現在地マーカー更新
      if (!userMarker) {
        userMarker = new google.maps.Marker({
          position: userLocation,
          map: map,
          title: "現在地",
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        });
      } else {
        userMarker.setPosition(userLocation);
      }

      // 地図中心を現在地に追従
      map.panTo(userLocation);

      // 徒歩ルート更新
      directionsService.route(
        {
          origin: userLocation,
          destination: { lat: shelter.lat, lng: shelter.lng },
          travelMode: google.maps.TravelMode.WALKING
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
          } else {
            console.error('経路取得失敗: ' + status);
          }
        }
      );

      // 到着判定（20m以内で通知）
      const distanceToShelter = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(userLocation.lat, userLocation.lng),
        new google.maps.LatLng(shelter.lat, shelter.lng)
      );
      if (distanceToShelter < 20) {
        alert(`${shelter.name}に到着しました！`);
        stopNavigation();
      }
    },
    error => {
      alert('位置情報取得に失敗しました。位置情報の利用を許可してください。');
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }
  );
}

// ナビ終了関数
function stopNavigation() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    alert("ナビを終了しました。");
  }
}
