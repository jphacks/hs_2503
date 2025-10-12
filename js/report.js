let selectedLatLng;



// ✅ 通れる／通れないを送信

function openReportDialog(latLng) {
  selectedLatLng = latLng;
  document.getElementById("reportDialog").style.display = "block";
}

function submitReport() {
  // 選択中のタイプを取得
  const statusRadio = document.querySelector('input[name="status"]:checked');
  if (!statusRadio) {
    alert("コメントタイプを選んでください");
    return;
  }
  const status = statusRadio.value;
  const comment = document.getElementById("comment").value;
  document.getElementById("reportDialog").style.display = "none";

  // タイプごとに表示ラベルとアイコンを決定
  let readableStatus, iconUrl;
  switch (status) {
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
      iconUrl = "img/step.svg"; // 新しいアイコンを用意
      break;
    case "comment":
      readableStatus = "コメント";
      iconUrl = "img/comment.svg"; // 新しいアイコンを用意
      break;
  }

  // --- 地図上にマーカーを追加 ---
  const marker = new google.maps.Marker({
    position: selectedLatLng,
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
  const payload = {
    lat: selectedLatLng.lat(),
    lng: selectedLatLng.lng(),
    status: readableStatus,
    comment: comment,
  };

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
}

