let selectedLatLng;
let tempMarker = null; // 仮ピン

// ✅ 報告フォームを開く（仮ピン設置）
function openReportDialog(latLng) {
    selectedLatLng = latLng;

    // 既存の仮ピンがあれば削除
    if (tempMarker) {
        tempMarker.setMap(null);
    }

    // 仮ピンを作成（ドラッグ可能）
    tempMarker = new google.maps.Marker({
        position: selectedLatLng,
        map: map,
        icon: {
            url: "img/temp-pin.svg", // 仮ピン用のアイコン
            scaledSize: new google.maps.Size(30, 30),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 30)
        },
        draggable: true, // ドラッグ可能
        opacity: 0.7     // 仮ピン感
    });

    // フォーム表示
    document.getElementById("reportDialog").style.display = "block";
}

// ✅ フォーム送信
function submitReport() {
    // ラジオボタン選択
    const statusRadio = document.querySelector('input[name="status"]:checked');
    if (!statusRadio) {
        alert("コメントタイプを選んでください");
        return;
    }

    const statusValue = statusRadio.value; // pass / fail / step / comment
    const comment = document.getElementById("comment").value;

    // ステータスラベルとアイコン
    let readableStatus, iconUrl;
    switch (statusValue) {
        case "pass":
            readableStatus = "通れる";
            iconUrl = "img/ok.svg";
            break;
        case "fail":
            readableStatus = "通れない";
            iconUrl = "img/ng.svg";
            break;
        case "step":
            readableStatus = "段差";
            iconUrl = "img/step.svg";
            break;
        case "comment":
            readableStatus = "コメント";
            iconUrl = "img/comment.svg";
            break;
    }

    // 仮ピンの位置を取得
    const lat = tempMarker.getPosition().lat();
    const lng = tempMarker.getPosition().lng();

    // --- 地図上に確定マーカーを追加 ---
    const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(24, 24),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(12, 24)
        }
    });

    const info = new google.maps.InfoWindow({
        content: `<b>${readableStatus}</b><br>${comment}`,
    });
    marker.addListener("click", () => info.open(map, marker));

    // --- サーバー送信 ---
    const payload = { lat, lng, status: readableStatus, comment };
    console.log("送信データ:", payload);

    fetch("https://hinavi.sakura.ne.jp/sendReport.php", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
    })
    .then(async (res) => {
        const text = await res.text();
        console.log("サーバー応答:", text);
        try {
            return JSON.parse(text);
        } catch {
            throw new Error("サーバーがJSONを返しませんでした: " + text);
        }
    })
    .then((data) => {
        if (data.success) {
            alert("報告を送信しました！");
        } else {
            alert("送信に失敗しました: " + (data.error || "原因不明"));
        }
    })
    .catch((err) => {
        console.error("送信エラー:", err);
        alert("通信エラー: " + err.message);
    });

    // フォーム非表示 & 仮ピン削除
    document.getElementById("reportDialog").style.display = "none";
    if (tempMarker) {
        tempMarker.setMap(null);
        tempMarker = null;
    }
}
// ページロード時にラベルクリックで選択ハイライト
document.querySelectorAll('.status-btn').forEach(label => {
  label.addEventListener('click', () => {
    // すべてのラベルからselectedクラスを削除
    document.querySelectorAll('.status-btn').forEach(l => l.classList.remove('selected'));
    // クリックされたラベルにselectedクラスを追加
    label.classList.add('selected');
    // ラジオボタンも選択状態にする
    label.querySelector('input').checked = true;
  });
});
