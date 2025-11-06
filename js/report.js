// js/report.js
// 報告処理、フォームの制御、評価処理を管理するメインファイル

// 💡 認証や地図の処理に必要な関数をインポート
// getAuthStatus は authStatus.js が既に呼び出しているので、ここでは不要な場合が多い
// import { getAuthStatus } from './auth.js'; 


let selectedLatLng;
let tempMarker = null; // 仮ピン (AdvancedMarkerElement) を保持

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
    // 🚨 map変数がグローバルまたは他からアクセス可能であることを前提とします
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
    // ラジオボタン選択チェック
    const statusRadio = document.querySelector('input[name="status"]:checked');
    if (!statusRadio) {
        alert("コメントタイプを選んでください");
        return;
    }

    const statusValue = statusRadio.value;
    const comment = document.getElementById("comment").value.trim();

    // コメントが必須でない場合はこのチェックは不要
    // if (!comment) {
    //     alert("コメントを入力してください");
    //     return;
    // }

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

    // 💡 【セキュア認証】：グローバル変数 window.AUTH_INFO から userId を取得
    // ログインしていればユーザーID（数値）、していなければ null
    const userId = window.AUTH_INFO ? window.AUTH_INFO.userId : null;

    // --- サーバー送信 ---
    // 💡 payload に user_id を追加
    const payload = { lat, lng, status: readableStatus, comment, user_id: userId };
    console.log("送信データ:", payload);

    fetch("https://hinavi.sakura.ne.jp/php/sendReport.php", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
    })
    // 💡 エラーハンドリング強化ブロック
    .then(async (res) => {
        // HTTPステータスが200番台以外の場合
        if (!res.ok) {
            const errorText = await res.text();
            console.error("サーバーエラー (HTTP Status " + res.status + "):", errorText);
            throw new Error("サーバーがエラーを返しました (HTTP " + res.status + ")。");
        }

        const text = await res.text();
        console.log("サーバー応答:", text);
        try {
            // PHP側が有効なJSON応答を返した場合
            return JSON.parse(text);
        } catch {
            // PHPの警告や致命的なエラー（JSONではないもの）が混ざっていた場合
            console.error("❌ サーバーが有効なJSONを返しませんでした。受信内容:", text);
            throw new Error("サーバーとの通信に成功しましたが、データ処理中にエラーが発生しました。");
        }
    })
    .then((data) => {
        if (data.success) {
            alert("報告を送信しました！");

            // コメント欄をクリア
            document.getElementById("comment").value = "";

            // ラジオボタンの選択とハイライトを解除
            document.querySelectorAll('input[name="status"]').forEach(r => r.checked = false);
            document.querySelectorAll('.status-btn').forEach(l => l.classList.remove('selected'));
            
            // 報告が成功したので、地図上の報告マーカーを再ロードして最新の状態にする
            // 🚨 window.loadReports 関数が他のファイルで定義されている必要があります
            if(window.loadReports) window.loadReports();

        } else {
            alert("送信に失敗しました: " + (data.error || "原因不明"));
        }
    })
    .catch((err) => {
        console.error("🔴 致命的な通信エラー:", err);
        alert("サーバーとの通信に失敗しました。詳細はコンソールを確認してください。");
    });

    // フォーム非表示 & 仮ピン削除
    document.getElementById("reportDialog").style.display = "none";
    if (tempMarker) {
        tempMarker.map = null;
        tempMarker = null;
    }
}

// ----------------------------------------------------
// 評価機能のヘルパー関数（いいね/悪いね）

/**
 * Local Storageからブラウザ固有のUUIDを取得または新規生成する
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

/**
 * 報告に対して評価を送信する（Infowindowから呼び出されることを想定）
 */
window.sendEvaluation = function (reportId, evaluationType) { 
    const browserUUID = getBrowserUUID();

    const payload = { 
        id: reportId,
        browser_uuid: browserUUID,
        evaluation_type: evaluationType // good or bad
    };

    fetch("https://hinavi.sakura.ne.jp/php/evaluateReport.php", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 成功時: UIを更新
            const likesElement = document.getElementById(`likes-count-${reportId}`);
            const dislikesElement = document.getElementById(`dislikes-count-${reportId}`);
            
            if (likesElement) likesElement.textContent = data.new_likes_count;
            if (dislikesElement) dislikesElement.textContent = data.new_dislikes_count;
            
            if (data.status === 'evaluated') {
                alert(`この報告には既に評価済みです。`);
            }
        } else {
            console.error("評価失敗:", data.error);
        }
    })
    .catch(error => console.error('通信エラー:', error));
}

// ----------------------------------------------------
// イベントリスナー

// ページロード時にラベルクリックで選択ハイライト (報告フォーム用)
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