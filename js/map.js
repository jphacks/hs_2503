let map;
let directionsService;
let directionsRenderer;
let userMarker;

function initMap() {
    const center = { lat: 34.3853, lng: 132.4553 };
    map = new google.maps.Map(document.getElementById("map"), {
    center: center,
    zoom: 16
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

  // 避難所マーカー
    shelters.forEach(shelter => {
        new google.maps.Marker({
        position: { lat: shelter.lat, lng: shelter.lng },
        map: map,
        title: shelter.name,
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
    });
    });

  // カード作成
    createShelterCards(startWalkingNavigation);
}
