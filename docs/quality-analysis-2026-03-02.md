# Tabelogg 品質分析レポート

**分析日**: 2026-03-02
**プロジェクト**: ラーメン店のレビュー・予約・チャットプラットフォーム
**技術スタック**: Laravel 12 + React 19 + TypeScript 5.9 / Docker / MySQL 8 / Redis / Meilisearch / Reverb (WebSocket)

---

## 総合スコア

| 領域 | 評価 | 概要 |
|------|------|------|
| **バックエンド(PHP)** | C+ | Fat Controller、FormRequest/Policy未使用、認可パターンの散在 |
| **フロントエンド(React/TS)** | B+ | 型定義・フック設計が良質。`useChat.ts`のanyが主な課題 |
| **データベース設計** | C | cascade削除の危険設定、インデックス不足、マイグレーション重複 |
| **インフラ/設定** | C- | 認証情報ハードコード、Rate Limiting未設定、開発用設定が本番向け未分離 |

---

## High 指摘事項（計20件）

### アーキテクチャ（6件）

| # | 箇所 | 問題 |
|---|------|------|
| 1 | Controllers全体 | **FormRequestクラスが一切ない**。全バリデーションがコントローラ内の`$request->validate()` |
| 2 | Controllers全体 | **Policyクラスが一切ない**。認可が全て`$model->user_id !== auth()->id()`のインライン判定 |
| 3 | `RestaurantController:15-125` | `index()`が約110行。検索・ページネーション・ソートが全部入り |
| 4 | `ReservationController:46-169` | `store()`が約123行。空席判定ロジックがコントローラに直書き |
| 5 | `RestaurantManageController:17-210` | `store()`と`update()`でバリデーション・画像保存・座席/時間設定の挿入が**完全重複**（各約90-100行） |
| 6 | `RestaurantManageController:216-285` | ジオコーディング処理がコントローラのprivateメソッド。Serviceに分離すべき |

### セキュリティ/インフラ（8件）

| # | 箇所 | 問題 |
|---|------|------|
| 7 | `bootstrap/app.php` | **API Rate Limitingが完全に未設定**。ブルートフォース攻撃に無防備 |
| 8 | `infra/mysql/Dockerfile:3-6` | DBパスワード`secret`がDockerイメージに焼き込み |
| 9 | `docker-compose.yml:61` | Meilisearchマスターキー`meilisearch`がハードコード |
| 10 | `infra/php/php.ini` | `display_errors=on`, `expose_php=on` — 本番でエラーとPHPバージョンが露出 |
| 11 | `config/cors.php:9-12` | `allowed_origins`がlocalhost限定。本番ドメイン未設定 |
| 12 | `config/reverb.php:85` | WebSocketの`allowed_origins`が`['*']`（全許可） |
| 13 | `AuthController.php:41` | `role_id`をユーザー入力から受け取り。ロール追加時の権限昇格リスク |
| 14 | `OwnerMiddleware.php:19` | `role_id !== 2`の厳密一致でAdmin(role_id=3)がオーナー機能にアクセス不可 |

### データベース（4件）

| # | 箇所 | 問題 |
|---|------|------|
| 15 | `create_cities_table.php:17` | `cities.prefecture_id`が`cascadeOnDelete`。**都道府県削除で市区町村→全店舗が連鎖削除** |
| 16 | `create_restaurants_table.php:21` | `restaurants.city_id`が`cascadeOnDelete`。市区町村削除で全店舗消滅 |
| 17 | 2つのマイグレーション | `latitude/longitude`を追加するマイグレーションが2つ存在し精度も異なる |
| 18 | `simplify_reports_table.php:43` | `report_images`テーブルを削除済みだが`ReportImage`モデルが残存 |

### Seeder/テスト（2件）

| # | 箇所 | 問題 |
|---|------|------|
| 19 | Seeder複数ファイル | 管理者パスワード`password123`、`11111111`がハードコード。本番実行で脆弱なアカウント作成 |
| 20 | `OwnerRestaurantSeeder.php:28` | 実在企業ドメインのメールアドレスがハードコード |

---

## Medium 指摘事項（主要15件）

| # | 箇所 | 問題 |
|---|------|------|
| 1 | `useChat.ts` | `any`が11箇所。TanStack Queryの`InfiniteData`型で置換可能 |
| 2 | `RestaurantDetailPage.tsx` | 616行に7コンポーネント同居。タブごとにファイル分割すべき |
| 3 | `ChatPage.tsx` | useState 7個、useCallback 9個。useReducerかカスタムフックへの整理が必要 |
| 4 | エラーレスポンス全体 | `response()->json()` / `abort()` / カスタムフォーマットの3パターンが混在 |
| 5 | `DashboardController:91-211` | `index()`が120行。予約・お気に入り・レビューを全件`get()`で取得（N+1/メモリリスク） |
| 6 | `Restaurant`モデル | `$fillable`に`review_summary`と`user_id`が含まれ、外部からの上書きリスク |
| 7 | `User`モデル | `role_id`の`$casts`がなく、厳密比較`=== 2`が文字列で失敗する可能性 |
| 8 | `Genre/MenuItem/MenuItemImage` | モデルが空または不完全。リレーション・$fillable未定義 |
| 9 | `Restaurant`モデル | `genres()`リレーション未定義（中間テーブルは存在する） |
| 10 | `config/sanctum.php:15` | トークン有効期限が`null`（無期限） |
| 11 | `config/session.php:172` | `secure`cookieがデフォルトfalse |
| 12 | `config/broadcasting.php:12-13` | Reverb key/secretにデフォルト値`laravel-reverb-key`がハードコード |
| 13 | `docker-compose.yml` | DB(3306)、Redis(6379)、Meilisearch(7700)のポートが全てホスト公開 |
| 14 | `infra/mysql/my.cnf:29` | `general_log=1`で全クエリログ記録（本番で容量/性能問題） |
| 15 | `MeCabService.php` | 入力文字列の長さ制限がなく、巨大入力でプロセスがハングする可能性 |

---

## フロントエンドの良い点

- `dangerouslySetInnerHTML`不使用でXSSリスクが低い
- TanStack Queryの高度機能（placeholderData、InfiniteQuery、refetchInterval）を適切に活用
- 仮想スクロール + プリフェッチによるパフォーマンス最適化
- WebSocket再接続時のキャッシュ無効化まで考慮
- CSRF保護（`withXSRFToken: true`）の実装
- カスタムフックによるロジック再利用が良質

---

## 改善優先度ロードマップ

### Phase 1: セキュリティ（最優先）
1. **Rate Limiting導入** — 認証エンドポイントのブルートフォース対策
2. **認証情報のハードコード除去** — DB/Meilisearchパスワードを`.env`経由に
3. **php.ini本番設定分離** — `display_errors=off`, `expose_php=off`
4. **cascadeOnDelete修正** — Prefecture/Cityを`restrictOnDelete`に変更

### Phase 2: アーキテクチャ改善
5. **FormRequestクラス導入** — 特にRestaurantManageControllerの重複解消
6. **Policyクラス導入** — Restaurant/Review/Reservation/ChatRoom
7. **Serviceクラス分離** — RestaurantSearchService, GeocodingService

### Phase 3: コード品質
8. **useChat.tsのany除去** — InfiniteData型の活用
9. **巨大コンポーネント分割** — RestaurantDetailPage, ChatPage
10. **role_idのEnum化** — マジックナンバー排除、$casts追加

---

## 詳細分析データ（参考）

### コントローラ別の長大メソッド

| ファイル | メソッド | 行数 |
|----------|----------|------|
| `ReservationController.php` | `store()` | 約123行 |
| `DashboardController.php` | `index()` | 約120行 |
| `RestaurantController.php` | `index()` | 約110行 |
| `RestaurantManageController.php` | `update()` | 約101行 |
| `RestaurantManageController.php` | `store()` | 約90行 |
| `ChatController.php` | `sendMessage()` | 約70行 |

### 旧自作コマンドとSuperClaude代替の対応

| 旧コマンド | 代替 | 用途 |
|---|---|---|
| `/code-simplifier` | `/sc:improve` + `/sc:cleanup` | リファクタリング |
| `/verify-app` | `/sc:test` | テスト実行 |
| `/review` | `/sc:analyze` | コード分析 |
