// --- CSVファイルを読み込む関数 ---
async function loadSheltersFromCSV(csvPath) {
    const response = await fetch(csvPath);
    const text = await response.text();

    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');

    const nameIndex = headers.indexOf('施設・場所名');
    const addressIndex = headers.indexOf('住所');
    const latIndex = headers.indexOf('緯度');
    const lngIndex = headers.indexOf('経度');

    const shelters = lines.slice(1).map(line => {
        const cols = line.split(',');
        return {
            name: cols[nameIndex]?.trim(),
            address: cols[addressIndex]?.trim(),
            lat: parseFloat(cols[latIndex]),
            lng: parseFloat(cols[lngIndex])
        };
    }).filter(s => s.name && !isNaN(s.lat) && !isNaN(s.lng));

    return shelters;
}

// --- 2点間の距離を計算（ハーサイン公式） ---
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球の半径 (km)
    const toRad = x => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// --- 避難所カード生成 ---
function createShelterCards(shelters, onClickCallback) {
    const listDiv = document.getElementById("shelter-list");
    listDiv.innerHTML = "";

    shelters.forEach(shelter => {
        const card = document.createElement('div');
        card.className = 'shelter-card';
        card.innerHTML = `
            <strong>${shelter.name}</strong><br>
            ${shelter.address}<br>
            <small>直線距離: ${shelter.distance.toFixed(2)} km</small><br>
        `;
        card.onclick = () => {
            onClickCallback(shelter);
            showShelterDetail(shelter);
        };
        listDiv.appendChild(card);
    });
}

// --- 避難所マーカー表示 ---
function addShelterMarkers(map, shelters, onClickCallback) {
    shelters.forEach(shelter => {
        const marker = new google.maps.Marker({
            position: { lat: shelter.lat, lng: shelter.lng },
            map: map,
            title: shelter.name,
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `<strong>${shelter.name}</strong><br>${shelter.address}`
        });

        marker.addListener("click", () => {
            infoWindow.open(map, marker);
            onClickCallback(shelter);
            showShelterDetail(shelter);
        });
    });
}

// --- 避難所詳細情報表示 ---
function showShelterDetail(shelter) {
    const detailDiv = document.getElementById("shelter-detail");
    const contentDiv = document.getElementById("detail-content");
    contentDiv.innerHTML = `
        <h3>${shelter.name}</h3>
        <p>${shelter.address}</p>
        <p>緯度: ${shelter.lat.toFixed(6)}, 経度: ${shelter.lng.toFixed(6)}</p>
        <p>距離: ${shelter.distance.toFixed(2)} km</p>
    `;
    detailDiv.style.display = "block";
}

// --- 閉じるボタン ---
document.getElementById("close-detail").addEventListener("click", () => {
    document.getElementById("shelter-detail").style.display = "none";
});

// --- メイン処理 ---
async function initShelterCards(map, onClickCallback) {
    try {
        const shelters = await loadSheltersFromCSV('csv/shelter_japan.csv');

        // 現在地取得
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;

                    // 各避難所との距離を計算
                    shelters.forEach(s => {
                        s.distance = calculateDistance(userLat, userLng, s.lat, s.lng);
                    });

                    // 近い順にソートして5件だけ取得
                    const nearest = shelters.sort((a, b) => a.distance - b.distance).slice(0, 5);

                    // カード表示
                    createShelterCards(nearest, onClickCallback);

                    // ピン表示
                    addShelterMarkers(map, nearest, onClickCallback);
                },
                error => {
                    console.error("現在地が取得できませんでした:", error);
                    alert("現在地が取得できません。ブラウザの位置情報設定を確認してください。");
                }
            );
        } else {
            alert("このブラウザでは位置情報が利用できません。");
        }
    } catch (error) {
        console.error("避難所データの読み込みに失敗しました:", error);
    }
}
