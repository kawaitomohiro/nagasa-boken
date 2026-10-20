# 長さの冒険

小学3年算数「長い長さ」（mm・cm・m・km）の練習アプリです。URLを開くだけで始まります。

**ひらく → https://kawaitomohiro.github.io/nagasa-boken/**

- 5つのコース：たんいをえらぶ／まきじゃくを読む／m ⇔ km／km・m のけいさん／ぜんぶミックス
- まきじゃくは「ぜんたい」と「大きく見る」の2段。＋−ボタンや2本指で大きくできる
- まちがえたら やさしい言葉と、3段のヒント（3つ目で考え方とこたえ）
- 続きから始まる。コースごとにクリアの印とほし
- 文字の大きさ（あ／あ＋／あ＋＋）・全画面・効果音・動きをへらす
- 先生の設定（問題数・むずかしさ・くり上がり・ヒントほか）は、画面のすみの「先生」から。合言葉は はじめに先生が決める（数字4〜8けた）
- 名前の入力・ログインはなし。記録はその端末のブラウザの中だけ（どこにも送らない）
- 一度開けば、通信がなくても動く。ホーム画面に追加できる

## 作り方

`src/app.html` がひな形。`python3 tools/build.py docs` で、書体（使う字だけ）とはじめの絵を埋めこんだ1枚の `docs/index.html` を作る（GitHub Pages で配信）。
確かめは `NODE_PATH=<playwright のある node_modules> node tools/test.js <URL>`。

## ライセンス

- アプリ本体：MIT License（`LICENSE`）
- 書体：Zen Maru Gothic（Copyright 2021 The Zen Maru Gothic Authors）SIL Open Font License 1.1（`docs/LICENSE-ZenMaruGothic.txt`）。画面で使う字だけにしぼって埋めこんでいます
- はじめの絵：画像生成AI（GPT Image）で作成
