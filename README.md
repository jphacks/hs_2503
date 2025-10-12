# [**hinavi**](hinavi.sakura.ne.jp)　〜避難をナビする防災コミュニティ〜
<p align="center">
  <a href="https://hinavi.sakura.ne.jp" target="_blank">
    <img src="https://github.com/user-attachments/assets/94130da6-b698-4b3f-a309-d0f6f5a68d44" 
         alt="Hinavi サムネイル" 
         style="width:800px; height:auto;">
  </a>
</p>


<div align="center">
🎉 <strong>JPHACKS 2025 Hack Day（@広島会場）</strong> 🎉<br>
🥇 <strong>「Best Hackday Award」受賞！</strong> 🥇<br>
🥇 <strong>「川田テクノシステム株式会社・スポンサー賞」受賞！</strong> 🥇<br>
🥇 <strong>「株式会社東海理化・スポンサー賞」受賞！</strong> 🥇
</div>

  
## 製品概要

### 【防災 X Tech】

[**地理情報弱者**](#geo-weaker)でも災害・避難所情報を理解できて、迅速な避難を可能にする  

> **注:** 地理情報弱者とは、外出先や旅行先で地理的に馴染みがないところで災害にあった人たちを指す <a name="geo-weaker"></a>

### 背景　（製品開発のきっかけ、課題等）

#### 製品開発のきっかけ
- 先日、津波警報が出た際に外国人旅行客が避難困難に
- 私達も、外出先では同様の問題に直面するのでは？？

#### 現状の課題
- 平常時でさえ多くの人が道に迷う  
  → 株式会社ゼンリン「地図利用実態調査2016」によると、18歳以上の大人2万人に対してにうち82.9%が「大人になっても迷った経験がある」と回答している[^1]
- 災害時は周囲の混乱や情報不足により、さらに困難に…
  
#### 既存アプリの問題点
- 情報提供や避難所表示に留まる
- 複数アプリを使い分ける必要がある
- リアルタイム避難経路や道路状況の提供はほとんどない



### 製品説明（具体的な製品の説明）

#### 特長
1. 災害情報の閲覧
2. 多言語対応🌐
3. 近隣避難所情報の閲覧
4. 現在地から近くの避難所までの経路をリアルタイムで案内・追跡
5. Google Mapsでは把握しづらい「通行可能な道」や「段差の有無」などのローカル情報をユーザーが投稿・共有できる

<p align="center">
<img width="612" height="381" alt="画像" src="https://github.com/user-attachments/assets/e70ac11c-a672-4ed3-8b57-bb316e650ae9" />
</p>

#### 解決出来ること（新規性）/デモ
- 1つのアプリで災害・避難所情報から経路案内まで避難に必要な機能が搭載されているため、[**地理情報弱者**](#geo-weaker)でも迷うことなく避難できる
- 災害時に生じる**地理情報格差**をなくすことができる
- 災害時の避難や避難所に関するコメントで情報共有ができる

<p align="center">
  <a href="https://drive.google.com/file/d/1tCF61xSyztlCRNxtlMuggq-MODYDm20a/view?usp=sharing" target="_blank">
    <img src="https://github.com/user-attachments/assets/910d54e9-c986-47e7-9fd1-e094e568ddd8" 
         alt="動画サムネイル" 
         style="width:612px; height:auto;">
  </a>
  <br>
  <strong> ▶️画像を押すとデモ動画に飛びます</strong>
</p>





#### 今後の展望・実装課題
- モバイル対応（最低限は使えるが、見た目が少し残念...）
- コメントにいいね機能を👍（コメントの信憑性を確保する何かが欲しい）
- 災害時にはユーザーの足跡（経路）を可視化したい
- 多言語対応（随時言語を増やしていく）
  
#### 注力したこと（こだわり等）
- 想定ユーザーを[**地理情報弱者**](#geo-weaker)に絞り、誰でも迷わず使えるUI/UX設計にしたこと
- ローカル情報をユーザーが投稿・共有できる機能を、MAP上のSNSとして簡単に確認・共有できる形にしたこと


## 開発技術

### 活用した技術

#### サーバ
- さくらのレンタルサーバ（スタンダードプラン）を使用
- Webサーバ: Apache
- PHP 8.2
- データベース: MySQL 8
- 公開URL: https://hinavi.sakura.ne.jp

#### API・データ
- Google Maps API
- 気象庁API
- 指定緊急避難場所・指定避難所データ（国土地理院）[^2]

#### フレームワーク・ライブラリ・モジュール
- Git
- HTML
- CSS
- JavaScript
- PHP
- SQL

#### デバイス
- PC
- iPhone

### 独自技術

#### ハッカソンで開発した独自機能・技術
- 地図上にアイコンやコメントを追加できる機能  
  -> https://github.com/jphacks/hs_2503/blob/main/js/report.js
- DB上に情報を保存し、地図上に随時反映される仕組み  
  -> https://github.com/jphacks/hs_2503/blob/main/js/map.js#L296-L346


## ディレクトリ構造
```
main/
├── index.html              # メインページ（地図表示・UI全体）
├── getReport.php           # DBから報告データを取得して返すAPI
├── sendReport.php          # 報告内容をDBへ保存するAPI
├── likes.php               # 「いいね」機能用のAPI（今後実装予定の機能）
│
├── css/                    # スタイル関連
│   └── style.css           # 全体のデザイン・レスポンシブ対応
│
├── csv/                    # CSVデータ置き場（避難所情報など）
│   ├── city_code.svg       # 気象庁API用市町村コード
│   ├── ・・・       　　　　　# 多言語対応避難所データ
│   └── shelter_japan.csv   # 指定緊急避難場所・指定避難所データ（国土地理院）
│
├── img/                    # アイコンや画像素材
│   ├── ok.svg              # 通れるマーカー
│   ├── ng.svg              # 通れないマーカー
│   ├── ・・・               # 各種マーカー
│   ├── step.svg            # 段差マーカー
│   └── comment.svg         # コメントマーカー
│
├── js/                     # JavaScript関連
│   ├── disaster-info.js    # 災害情報取得
│   ├── lang.js             # 多言語対応
│   ├── map.js              # Google Maps制御・現在地追跡・投稿機能
│   ├── navigation.js       # 経路案内
│   ├── report.js           # コメント共有機能
│   └── shelters.js         # 避難所情報
│
├── LICENSE                 # ライセンス情報
└── README.md               # プロジェクト概要・使い方・構成説明
```
### 参考文献
[^1]:https://www.zenrin.co.jp/product/article/research503/pdf/material05.pdf
[^2]:https://www.gsi.go.jp/bousaichiri/hinanbasho.html
