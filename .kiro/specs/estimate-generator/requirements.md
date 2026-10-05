# Requirements Document

## Introduction

見積書ジェネレーターは、「工数明細シート」と「顧客向け見積書」の2つのビューを持つ、ブラウザ完結型のWebアプリケーションである。ユーザーは工数明細シートに作業項目と製造工数を入力すると、各工程の工数が係数により自動計算され、その集計値から顧客向け見積書の明細行が自動生成される。ログイン・サーバー保存は不要で、入力内容はsessionStorageに保持される。最終的にA4縦1枚のPDFとして書き出し、顧客へ提出できる。

## Glossary

- **App**: 見積書ジェネレーター Webアプリケーション全体
- **User**: Appを操作するエンドユーザー（顧客への見積を作成する担当者）
- **WorkItem**: 工数明細シートの1行分（No・機能名・カテゴリ・状態・備考・製造工数）
- **Phase**: 工程（進行管理・要件定義・基本設計・レビュー・テスト設計・テスト・ユーザテストFB・リリース・製造）
- **PhaseCoefficient**: 製造工数に乗じて各工程工数を算出する係数（設定ファイルで管理）
- **WorksheetView**: 工数明細シートを表示・編集する画面
- **EstimateSection**: 顧客向け見積書の明細区分（要件定義・管理・設計・製造・テスト・リリース）
- **EstimateView**: 顧客向け見積書を表示・編集する画面
- **ManualLineItem**: EstimateViewに手動で追加する明細行（運用保守費など）
- **DailyRate**: 人日単価（EstimateSectionごとに設定可能）
- **Subtotal**: 消費税を含まない見積書明細行の合計金額
- **TaxAmount**: 消費税額（Subtotal × 10% の小数点以下切り捨て）
- **TotalAmount**: 税込合計金額（Subtotal + TaxAmount）
- **Header**: 見積書のヘッダー情報（発行日・見積番号・宛先・件名・有効期限・備考文）
- **CompanyInfo**: 設定ファイルから読み込む自社情報（社名・担当者・住所・TEL・メール・登録番号）
- **ConfigFile**: アプリの動作を制御するJSONファイル（PhaseCoefficient・EstimateSection マッピング・CompanyInfoを含む）
- **PDF_Exporter**: 見積書をPDFファイルとして書き出す機能
- **CSV_Exporter**: 工数明細シートをCSVファイルとして書き出す機能

---

## Requirements

### Requirement 1: 工数明細シートの WorkItem 管理

**User Story:** 見積担当者として、WorksheetViewで作業項目を追加・編集・削除したい。そうすることで、機能名・製造工数を正確に記録できる。

#### Acceptance Criteria

1. THE App SHALL WorksheetViewに WorkItem を追加・編集・削除するインターフェイスを提供すること。
2. THE App SHALL 各 WorkItem に以下の列を提供すること: No（行番号、自動採番）、機能・要望（最大200文字）、備考（最大400文字）、製造工数（人日、0以上の数値）。
3. WHEN User が「行を追加」ボタンをクリックした場合, THE App SHALL 空の WorkItem を末尾に追加し、各入力欄を編集可能な状態で表示すること。
4. WHEN User が WorkItem の削除ボタンをクリックした場合, THE App SHALL 対象の WorkItem を削除し、残存する WorkItem の No を連番で振り直すこと。
5. IF 製造工数フィールドに0未満の値または数値以外の文字が入力された場合, THEN THE App SHALL 該当フィールドをエラー状態で表示し、工程工数の再計算を実行しないこと。
6. THE App SHALL 製造工数の入力欄をテキスト入力とし、数値（整数または小数）以外の文字が入力された場合は無効な入力として扱うこと。
7. THE App SHALL WorkItem の並び替え（上下移動ボタンまたはドラッグ＆ドロップ）をサポートし、並び替え後の No を即時に振り直すこと。

---

### Requirement 2: 工程工数の自動計算

**User Story:** 見積担当者として、設定ファイルで変更可能な係数を使って製造工数から各工程工数を自動計算したい。そうすることで、手作業の計算なしに工数の内訳を確認できる。

#### Acceptance Criteria

1. THE App SHALL 各 Phase の工数を「製造工数 × PhaseCoefficient」として自動計算すること。デフォルトの PhaseCoefficient は以下の通りとする: 進行管理 15%、要件定義 20%、基本設計 30%、レビュー 5%、テスト設計 5%、テスト 15%、ユーザテストFB 2%、リリース 2%。
2. WHEN WorkItem の製造工数が変更された場合, THE App SHALL 当該 WorkItem の全 Phase 工数を 500ミリ秒以内に再計算して表示すること。
3. WHILE WorkItem の状態が「変更なし」である場合, THE App SHALL 当該 WorkItem の全 Phase 工数（製造工数を含む）を0として表示すること。
4. THE App SHALL 各 WorkItem の行合計工数（全 Phase 工数の合計）を表示すること。
5. THE App SHALL WorksheetView の最下行に全 WorkItem の工程別合計工数および総合計工数を集計して表示すること。
6. WHERE ConfigFile に PhaseCoefficient の定義が存在する場合, THE App SHALL ConfigFile の値を優先してデフォルト係数を上書きすること。
7. THE App SHALL 各 Phase の工数（製造工数 × PhaseCoefficient の結果）を小数第2位まで表示・計算し、小数第3位以下は四捨五入すること。

---

### Requirement 3: 設定ファイルによるアプリ設定の管理

**User Story:** 見積担当者として、アプリの動作をJSON設定ファイルで制御したい。そうすることで、ソースコードを変更せずに工程係数・区分マッピング・自社情報をカスタマイズできる。

#### Acceptance Criteria

1. WHEN App が起動した場合, THE App SHALL `config.json` の読み込みを試み、ファイルが存在しない場合は `config.sample.json` を読み込んで CompanyInfo・PhaseCoefficient・EstimateSection マッピングを初期化すること。
2. THE ConfigFile SHALL 以下のキーを含む JSON 構造とすること: `companyInfo`（社名・担当者・住所・TEL・メール・登録番号）、`phaseCoefficients`（Phase名をキー、係数を値とするオブジェクト）、`sectionMappings`（EstimateSection名をキー、対応する Phase 名の配列を値とするオブジェクト）。
3. THE App SHALL `config.json` を `.gitignore` に登録し、リポジトリに含めないこと。`config.sample.json` はサンプル値を含む状態でリポジトリに含めること。
4. IF `config.json` も `config.sample.json` も読み込みに失敗した場合, THEN THE App SHALL ハードコードされたデフォルト値を使用してアプリを起動し、設定読み込みエラーを開発者コンソールに出力すること。
5. FOR ALL ConfigFile の phaseCoefficients エントリ、値は0より大きく1以下の数値でなければならず、範囲外の値が指定された場合は THE App SHALL 該当 Phase のデフォルト係数を使用すること。

---

### Requirement 4: 顧客向け見積書ヘッダーの入力

**User Story:** 見積担当者として、見積書のヘッダー情報を入力したい。そうすることで、正式な見積書として体裁を整えられる。

#### Acceptance Criteria

1. THE App SHALL EstimateView のヘッダー入力フォームに以下のフィールドを提供すること: 発行日、見積番号（最大50文字）、宛先（会社名、最大100文字、「○○株式会社 御中」形式で表示）、件名（最大200文字）、有効期限、備考文（最大400文字）。
2. THE App SHALL ConfigFile から読み込んだ CompanyInfo（社名・担当者・住所・TEL・メール・登録番号）を見積書に自動表示すること。ユーザーによる画面上での CompanyInfo の編集は不要とする。
3. WHEN User が発行日フィールドを空白のまま PDF 書き出しを実行しようとした場合, THE App SHALL 発行日は必須であることを示すバリデーションエラーを表示し、書き出しを中止すること。
4. IF User が有効期限に操作日より過去の日付を入力した場合, THEN THE App SHALL 有効期限が本日以降である旨の警告メッセージを表示すること。ただし、そのまま保存・書き出しを続行できること。
5. WHEN User がヘッダーフィールドの入力内容を変更した場合, THE App SHALL 500ミリ秒以内に EstimateView のプレビューにヘッダー情報を反映すること。

---

### Requirement 5: 見積書明細行の自動生成と手動追加

**User Story:** 見積担当者として、工数明細の集計値から見積書の明細行が自動生成され、さらに手動で行を追加したい。そうすることで、二重入力なく完全な見積書を作成できる。

#### Acceptance Criteria

1. THE App SHALL WorksheetView の工程別合計工数を以下の EstimateSection にマッピングして見積書の明細行を自動生成すること（デフォルトマッピング）: 要件定義 ← 要件定義、管理 ← 進行管理、設計 ← 基本設計、製造 ← 製造工数、テスト ← レビュー＋テスト設計＋テスト＋ユーザテストFB、リリース ← リリース。
2. WHERE ConfigFile に sectionMappings の定義が存在する場合, THE App SHALL ConfigFile の値を優先して EstimateSection マッピングを上書きすること。
3. WHEN WorksheetView の工数が変更された場合, THE App SHALL 500ミリ秒以内に EstimateView の自動生成明細行の数量（人日）を更新すること。
4. THE App SHALL 各自動生成明細行に「品名・数量（人日）・単価（DailyRate）・金額」を表示すること。
5. THE App SHALL DailyRate を EstimateView の画面上で入力できるようにすること。DailyRate は全区分共通のデフォルト値の設定と、EstimateSection ごとの個別設定の両方をサポートすること。
6. THE App SHALL 自動生成明細行とは別に ManualLineItem を手動で追加できる機能を提供すること。ManualLineItem は品名（最大200文字）・数量・単位・単価の入力欄を持ち、金額は自動計算で表示すること。
7. WHEN User が ManualLineItem の削除ボタンをクリックした場合, THE App SHALL 対象の ManualLineItem を削除し、合計金額を即時に再計算すること。
8. THE App SHALL 各明細行の金額を「数量 × 単価」の円未満（小数点以下）を切り捨てた整数値で計算すること。
9. IF 数量または単価に0未満の値または数値以外の文字が入力された場合, THEN THE App SHALL 該当フィールドをエラー状態で表示し、金額の再計算を実行しないこと。

---

### Requirement 6: 見積金額の自動計算と表示

**User Story:** 見積担当者として、小計・消費税・税込合計が自動計算され目立つ形で表示されるようにしたい。そうすることで、正確な見積金額を顧客に提示できる。

#### Acceptance Criteria

1. WHEN 明細行の数量または単価が変更された場合, THE App SHALL 全明細行の金額（数量 × 単価）の合計を Subtotal として 500ミリ秒以内に再計算すること。
2. THE App SHALL TaxAmount を Subtotal × 10% の小数点以下切り捨てで算出し、TotalAmount を Subtotal + TaxAmount として表示すること。
3. THE App SHALL EstimateView の上部に「お見積金額」として TotalAmount（税込合計）を他の要素より目立つ形式で表示すること。
4. THE App SHALL 小計・消費税額（10%）・税込合計の内訳を見積書に表示すること。
5. THE App SHALL Subtotal・TaxAmount・TotalAmount・各明細行の金額を3桁カンマ区切りの日本円形式（例: ¥1,234,567）で表示すること。

---

### Requirement 7: PDFの書き出し

**User Story:** 見積担当者として、作成した見積書をA4サイズのPDFとして日本語が正しく表示された状態でダウンロードしたい。そうすることで、顧客にメールや印刷で提出できる。

#### Acceptance Criteria

1. THE App SHALL「PDF で書き出す」ボタンを EstimateView に提供すること。
2. WHEN User が「PDF で書き出す」ボタンをクリックした場合, THE PDF_Exporter SHALL 現在の見積書データをもとに PDF ファイルを生成し、ブラウザのダウンロードとして提供すること。
3. THE PDF_Exporter SHALL 出力 PDF を A4 縦向き（210mm × 297mm）の1ページに収めること。明細行が多い場合は2ページ以上に分割してもよいが、1ページに収まる場合は必ず1ページとすること。
4. THE PDF_Exporter SHALL 日本語フォントを埋め込み、PDF 内の日本語テキストが文字化けなく表示されることを保証すること。
5. THE PDF_Exporter SHALL 出力 PDF のファイル名を `見積書_{{宛先会社名}}_{{発行日}}.pdf` 形式で設定すること（例: `見積書_株式会社サンプル_20250101.pdf`）。
6. IF 宛先会社名または発行日が未入力の場合, THEN THE PDF_Exporter SHALL ファイル名の該当箇所を `不明` で代替し（例: `見積書_不明_不明.pdf`）、PDF の生成を継続すること。
7. WHEN PDF の生成中, THE App SHALL 処理中であることを示すローディングインジケーターを表示し、「PDF で書き出す」ボタンを無効化すること。
8. IF PDF 生成中にエラーが発生した場合, THEN THE App SHALL ユーザーにエラー内容を示すメッセージを表示し、「PDF で書き出す」ボタンを再び有効化すること。

---

### Requirement 8: 入力データの sessionStorage 保存

**User Story:** 見積担当者として、同一ブラウザセッション内でページをリロードしても入力内容が保持されるようにしたい。そうすることで、誤ってリロードしても作業内容を失わずに済む。

#### Acceptance Criteria

1. WHEN User が App のいずれかのデータを編集してから3秒以内, THE App SHALL 工数明細シートのデータ・見積書ヘッダー・ManualLineItem・DailyRate 設定をすべて sessionStorage のキー `estimate-generator:session` に自動保存すること。
2. WHEN User が同一セッション内で App をリロードした場合, THE App SHALL sessionStorage から保存データを読み込み、編集内容を復元すること。
3. WHEN ブラウザのタブまたはウィンドウを閉じた場合, THE App SHALL sessionStorage のデータが消去されることを前提とし、永続化の手段を提供しないこと。
4. IF sessionStorage の保存データが有効なアプリデータ形式でない場合, THEN THE App SHALL そのデータを破棄し、空の初期状態で起動すること。
5. FOR ALL 有効なアプリデータオブジェクト、JSON にシリアライズしてから sessionStorage を介してデシリアライズした結果は、すべてのフィールドの値が元のオブジェクトと等価であること（ラウンドトリップ特性）。

---

### Requirement 9: 入力値のバリデーション

**User Story:** 見積担当者として、不正な値を入力した際に即座に通知を受け取りたい。そうすることで、誤ったデータで見積書が作成されるのを防げる。

#### Acceptance Criteria

1. WHEN User が必須フィールド（発行日・宛先会社名・件名）を未入力のまま PDF 書き出しを実行しようとした場合, THE App SHALL 該当フィールドをエラー状態で表示し、エラーメッセージを提示して書き出しを中止すること。
2. IF 製造工数・数量・単価に0未満の値が入力された場合, THEN THE App SHALL 該当フィールドを赤枠でハイライト表示し、「0以上の値を入力してください」というメッセージを表示すること。
3. IF 単価に999,999,999を超える値が入力された場合, THEN THE App SHALL 入力欄をエラー状態で表示し、「単価の上限は ¥999,999,999 です」というメッセージを表示すること。
4. IF 製造工数または数量に999,999を超える値が入力された場合, THEN THE App SHALL 入力欄をエラー状態で表示し、「値の上限は 999,999 です」というメッセージを表示すること。
5. WHEN User がバリデーションエラーのあるフィールドを正しい値に修正した場合, THE App SHALL バリデーションエラー表示を200ミリ秒以内に解除すること。
6. WHILE バリデーションエラーが存在する場合, THE App SHALL PDF 書き出しボタンを無効化すること。

---

### Requirement 10: 工数明細の CSV ダウンロード

**User Story:** 見積担当者として、工数明細シートの内容を CSV ファイルとしてダウンロードしたい。そうすることで、Excel 等で工数データを再利用・共有できる。

#### Acceptance Criteria

1. THE App SHALL WorksheetView に「CSV ダウンロード」ボタンを提供すること。
2. WHEN User が「CSV ダウンロード」ボタンをクリックした場合, THE App SHALL 現在の工数明細データを CSV ファイルとしてブラウザのダウンロードとして提供すること。
3. THE App SHALL CSV のヘッダー行と各 WorkItem 行に以下の列を出力すること: No、機能・要望、備考、製造工数、各 Phase の工数（進行管理・要件定義・基本設計・レビュー・テスト設計・テスト・ユーザテストFB・リリース・製造）、行合計。
4. THE App SHALL CSV の最終行に工程別合計工数および総合計工数を集計した合計行を出力すること。
5. THE App SHALL CSV のセル値にカンマ・ダブルクォート・改行が含まれる場合、RFC 4180 に従ってダブルクォートで囲み、内部のダブルクォートを 2 つに重ねてエスケープすること。
6. THE App SHALL 日本語の文字化けを防ぐため、CSV ファイルを UTF-8（BOM 付き）で出力すること。
7. THE App SHALL 出力 CSV のファイル名を `工数明細_{{発行日}}.csv` 形式で設定すること（例: `工数明細_20250101.csv`）。発行日が未入力の場合は操作日の日付を使用すること。
8. THE App SHALL 工程工数の数値を小数第2位まで（四捨五入後の値）で出力すること。
