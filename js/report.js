// report.js
let selectedLatLng;
let tempMarker = null; // 仮ピン (AdvancedMarkerElement に変わる)
// ✅ 報告フォームを開く（仮ピン設置）
function openReportDialog(latLng) {
    selectedLatLng = latLng;

    // 既存の仮ピンがあれば削除
    if (tempMarker) {
        tempMarker.map = null;
    }
    
    // 1. 仮ピンのカスタムアイコン用のDOM要素を作成
    const tempIconElement = document.createElement('img');
    tempIconElement.src = "img/temp-pin.svg"; // 仮ピン用のアイコン
    tempIconElement.style.width = '30px'; 
    tempIconElement.style.height = '30px';
    tempIconElement.style.opacity = '0.7'; 
    
    // 2. 仮ピンを作成（ドラッグ可能）
    tempMarker = new google.maps.marker.AdvancedMarkerElement({
        position: selectedLatLng,
        map: map,
        title: "報告地点 (ドラッグ可能)",
        content: tempIconElement, 
        draggable: true,
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
    const lat = tempMarker.position.lat; 
    const lng = tempMarker.position.lng;

    // --- サーバー送信 ---
    const payload = { lat, lng, status: readableStatus, comment };
    console.log("送信データ:", payload);

    fetch("https://hinavi.sakura.ne.jp/php/sendReport.php", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
    })
    // ... (送信後の処理はそのまま) ...
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

            // マーカーを再読み込みすることで、追加されたマーカーといいね数が地図に反映されます
            // ただし、パフォーマンスのため、通常は新規マーカーを直接地図に追加します
            // ここでは簡易的に画面全体をリロードする代わりに、入力内容をクリア
            
            // コメント欄をクリア
            document.getElementById("comment").value = "";

            // ラジオボタンの選択を解除
            document.querySelectorAll('input[name="status"]').forEach(r => r.checked = false);

            // ボタンのハイライトも解除
            document.querySelectorAll('.status-btn').forEach(l => l.classList.remove('selected'));
            
            // 報告が成功したので、地図上の報告マーカーを再ロードして最新の状態にする
            if(window.loadReports) window.loadReports();

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
        tempMarker.map = null;
        tempMarker = null;
    }
}

// ----------------------------------------------------
// report.js または map.js (既存の likeReport の代わりに定義)

/**
 * Local Storageからブラウザ固有のUUIDを取得または新規生成する（以前の定義を再利用）
 */
function getBrowserUUID() {
    let uuid = localStorage.getItem('browser_uuid');
    if (!uuid) {
        uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        localStorage.setItem('browser_uuid', uuid);
    }
    return uuid;
}


window.sendEvaluation = function (reportId, evaluationType) { // 💡 タイプを引数に追加
    const browserUUID = getBrowserUUID();

    const payload = { 
        id: reportId,
        browser_uuid: browserUUID,
        evaluation_type: evaluationType // 💡 評価タイプ (good or bad) を送信
    };

    fetch("https://hinavi.sakura.ne.jp/php/evaluateReport.php", { // 💡 APIファイル名を変更推奨
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 💡 成功時: UIを更新
            document.getElementById(`likes-count-${reportId}`).textContent = data.new_likes_count;
            document.getElementById(`dislikes-count-${reportId}`).textContent = data.new_dislikes_count;
            
            // 💡 既に評価済みの場合、ボタンを非アクティブ化 (CSSの active クラスを適用)
            if (data.status === 'evaluated') {
                // UI更新ロジックをここに記述
                alert(`この報告には既に評価済みです。`);
            } else {
                // 新規評価の場合はボタンのスタイルを変更するロジックをここに記述
            }
        } else {
            console.error("評価失敗:", data.error);
        }
    })
    .catch(error => console.error('通信エラー:', error));
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

// ×ボタンでフォームを閉じる処理
document.getElementById("close-report").addEventListener("click", () => {
  // フォームを非表示
  document.getElementById("reportDialog").style.display = "none";

  // 仮ピンを削除
  if (tempMarker) {
    tempMarker.map = null;
    tempMarker = null;
  }

  // 入力内容をリセット
  document.getElementById("comment").value = "";
  document.querySelectorAll('input[name="status"]').forEach(r => r.checked = false);
  document.querySelectorAll('.status-btn').forEach(l => l.classList.remove('selected'));
});