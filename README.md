# mytasks

ダーク系ToDoアプリ。iPhone対応。

## Vercelへのデプロイ手順

### 1. GitHubにアップロード

1. [github.com](https://github.com) でアカウントを作成（または既存のアカウントでログイン）
2. 右上の「＋」→「New repository」をクリック
3. Repository name に `mytasks` と入力して「Create repository」
4. 表示された手順に従ってこのフォルダをアップロード（または GitHub Desktop アプリを使うと簡単）

### 2. Vercelにデプロイ

1. [vercel.com](https://vercel.com) にアクセスして「Sign Up」→ GitHubアカウントでログイン
2. 「Add New Project」をクリック
3. `mytasks` リポジトリを選択して「Import」
4. 設定はそのままで「Deploy」をクリック
5. 数分で `https://mytasks-xxxx.vercel.app` のようなURLが発行される

### 3. iPhoneのホーム画面に追加

1. Safariで発行されたURLを開く
2. 下の共有ボタン（□↑）→「ホーム画面に追加」
3. アプリとして起動できる

## ローカルで動かす場合

```bash
npm install
npm run dev
```

## 注意

データはブラウザのlocalStorageに保存されます。
友達それぞれのスマホでデータは独立して保存されます。
