let selectedLatLng;

// ✅ マップクリック時に報告用UIを開く
function openReportDialog(latLng) {
  selectedLatLng = latLng;
  document.getElementById("reportDialog").style.display = "block";
}

// ✅ 通れる／通れないを送信
function submitReport(status) {
  const comment = document.getElementById("comment").value;
  document.getElementById("reportDialog").style.display = "none";

  const readableStatus = status === "pass" ? "通れる" : "通れない";

  // --- 地図上にマーカーを追加 ---
  const iconUrl =
    status === "pass"
      ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
      : "https://maps.google.com/mapfiles/ms/icons/red-dot.png";

  const marker = new google.maps.Marker({
    position: selectedLatLng,
    map,
    icon: iconUrl,
  });

  const info = new google.maps.InfoWindow({
    content: `<b>${readableStatus}</b><br>${comment}`,
  });
  marker.addListener("click", () => info.open(map, marker));

  // --- サーバーに送信 ---
  const payload = {
    lat: selectedLatLng.lat(),
    lng: selectedLatLng.lng(),
    status: readableStatus, // DB定義に合わせる
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
