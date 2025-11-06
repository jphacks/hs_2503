import { getAuthStatus } from '../js/auth.js';

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const authInfo = await getAuthStatus();

    if (!authInfo || !authInfo.isLoggedIn) {
      alert("ログインしていません");
      window.location.href = "/index.html";
      return;
    }

    // ユーザー名反映
    document.getElementById("username").textContent = authInfo.username;

    // ✅ サーバからポイント取得（例）
    // 実際はAPIエンドポイントを変更してください
    let points = 0;
    try {
      const res = await fetch("/api/points");
      const data = await res.json();
      points = data.points;
    } catch (e) {
      console.warn("ポイント取得に失敗（テスト値を使用）");
      points = 110; // テスト用
    }
    document.getElementById("points").textContent = points;

    // ✅ 実績データ定義（例：必要回数・現在回数）
    const achievements = [
      { id: "login", title: "はじめの一歩", desc: "初めてログインする", icon: "../img/badge/new_leaf.png", required: 1, current: authInfo.loginCount },
      { id: "like", title: "いいねしてみた！", desc: "投稿に初めて「いいね」する", icon: "../img/badge/hold_hands.png", required: 1, current: authInfo.likeCount },
      { id: "comment", title: "コメントしてみた！", desc: "初めてコメント投稿", icon: "../img/badge/rocket.png", required: 1, current: authInfo.commentCount },
      { id: "post3", title: "アクティブデビュー", desc: "投稿を3回行う", icon: "../img/badge/diamond.png", required: 3, current: authInfo.postCount },
      { id: "reply1", title: "フレンドリーさん", desc: "他のユーザーに1回返信", icon: "../img/badge/star.png", required: 1, current: authInfo.replyCount },
      { id: "like_get", title: "人気のたね", desc: "投稿にいいねを1回もらう", icon: "../img/badge/celebrate.png", required: 1, current: authInfo.likeReceivedCount },
    ];

    const list = document.getElementById("achievementList");

    achievements.forEach(a => {
      const li = document.createElement("li");
      li.classList.add("achievement");
      if (a.current < a.required) li.classList.add("locked");

      li.innerHTML = `
        <img src="${a.icon}" alt="${a.title}" class="icon">
        <div>
          <div class="title">${a.title}</div>
          <div class="desc">${a.desc}</div>
        </div>
      `;

      list.appendChild(li);
    });

    // ✅ 進捗バー更新（例：ポイントで換算）
    const progressEl = document.getElementById("progress");
    const progress = Math.min(points / 200, 1) * 100;
    progressEl.style.width = progress + "%";

  } catch (error) {
    console.error("マイページ処理中にエラー:", error);
    alert("ページの読み込み中にエラーが発生しました。");
    window.location.href = "/index.html";
  }
});
