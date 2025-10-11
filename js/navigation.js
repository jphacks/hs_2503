let watchId;

function startWalkingNavigation(shelter) {
  if (!navigator.geolocation) {
    alert('このブラウザは位置情報をサポートしていません。');
    return;
  }

  if (watchId) navigator.geolocation.clearWatch(watchId);

  watchId = navigator.geolocation.watchPosition(
    position => {
      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // 現在地マーカー
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

      // 徒歩ルート表示
      directionsService.route(
        {
          origin: userLocation,
          destination: { lat: shelter.lat, lng: shelter.lng },
          travelMode: 'WALKING'
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
          } else {
            console.error('経路取得失敗: ' + status);
          }
        }
      );

      map.setCenter(userLocation);
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
