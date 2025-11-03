// ============================
// 🌏 経路案内管理用変数
// ============================
let directionsService;
let directionsRenderers = [];
let selectedRouteIndex = null;
let routeData = null;
let navigationActive = false;
let watchId = null;

// ============================
// 🚶 経路を表示（複数候補）
// ============================
function showRouteToShelter(shelter) {
    if (!userPosition) {
        alert("現在地を取得できませんでした。");
        return;
    }

    directionsService = new google.maps.DirectionsService();

    const request = {
        origin: userPosition,
        destination: { lat: shelter.lat, lng: shelter.lng },
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            routeData = result.routes;
            clearRoutes();

            const colors = ["#1976D2", "#43A047", "#E53935"];

            result.routes.slice(0, 3).forEach((route, i) => {
                const renderer = new google.maps.DirectionsRenderer({
                    map: map,
                    directions: result,
                    routeIndex: i,
                    polylineOptions: {
                        strokeColor: colors[i],
                        strokeOpacity: 0.7,
                        strokeWeight: 6
                    },
                    suppressMarkers: false
                });

                directionsRenderers.push(renderer);

                // 🔹 クリックで選択
                const bounds = route.bounds;
                const listener = google.maps.event.addListener(map, 'click', (e) => {
                    if (bounds.contains(e.latLng)) {
                        selectRoute(i);
                        google.maps.event.removeListener(listener);
                    }
                });
            });

            showRouteSelectionUI(result.routes);
        } else {
            alert("経路を取得できませんでした: " + status);
        }
    });
}

// ============================
// 🔹 経路選択
// ============================
function selectRoute(index) {
    selectedRouteIndex = index;
    directionsRenderers.forEach((r, i) => {
        r.setOptions({
            polylineOptions: {
                strokeOpacity: i === index ? 1.0 : 0.3,
                strokeWeight: i === index ? 7 : 4
            }
        });
    });

    document.getElementById("nav-start-btn").style.display = "block";
}

// ============================
// 🚦 経路案内開始
// ============================
function startNavigation() {
    if (selectedRouteIndex === null) {
        alert("経路を選択してください。");
        return;
    }

    navigationActive = true;
    alert("経路案内を開始します。");

    // ルート情報を取得
    const steps = routeData[selectedRouteIndex].legs[0].steps;
    let currentStep = 0;

    // 現在地追跡
    watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const currentPos = new google.maps.LatLng(lat, lng);
            map.setCenter(currentPos);

            // 距離計算して次のステップへ
            const nextPoint = steps[currentStep].end_location;
            const dist = google.maps.geometry.spherical.computeDistanceBetween(currentPos, nextPoint);

            if (dist < 15 && currentStep < steps.length - 1) {
                currentStep++;
                showStepInstruction(steps[currentStep].instructions);
            }
        },
        (err) => {
            console.error(err);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    showStepInstruction(steps[0].instructions);
}

// ============================
// 📣 案内テキストを表示
// ============================
function showStepInstruction(instruction) {
    const box = document.getElementById("instruction-box");
    box.innerHTML = instruction.replace(/<div.*?>|<\/div>/g, "");
    box.style.display = "block";
}

// ============================
// 🧹 経路削除
// ============================
function clearRoutes() {
    directionsRenderers.forEach(r => r.setMap(null));
    directionsRenderers = [];
    selectedRouteIndex = null;
    routeData = null;
}

// ============================
// 🛑 案内終了
// ============================
function stopNavigation() {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    navigationActive = false;
    alert("案内を終了しました。");
    document.getElementById("instruction-box").style.display = "none";
}
