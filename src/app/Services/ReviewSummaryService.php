<?php

namespace App\Services;

use App\Models\Restaurant;
use Illuminate\Support\Facades\Log;

class ReviewSummaryService
{
    protected OllamaService $ollama;

    public function __construct(OllamaService $ollama)
    {
        $this->ollama = $ollama;
    }

    /**
     * レストランのレビュー要約を生成する
     *
     * @param Restaurant $restaurant
     * @return array|null レビューが0件の場合はnull
     */
    public function generate(Restaurant $restaurant): ?array
    {
        $reviews = $restaurant->reviews()->with('user')->get();

        if ($reviews->isEmpty()) {
            return null;
        }

        $reviewCount = $reviews->count();

        // レビュー情報を整形
        $reviewTexts = $reviews->map(function ($review) {
            $rating = $review->rating;
            $comment = $review->comment ?? '（コメントなし）';
            return "評価: {$rating}/5 コメント: {$comment}";
        })->implode("\n");

        // プロンプトを構築
        $prompt = $this->buildPrompt($reviewTexts, $reviewCount);

        // Ollama API で要約を生成
        $response = $this->ollama->generate($prompt);

        if ($response === null) {
            Log::warning('Ollama returned null for restaurant', [
                'restaurant_id' => $restaurant->id,
            ]);
            return null;
        }

        // JSONをパース
        $parsed = $this->parseResponse($response);

        if ($parsed === null) {
            Log::warning('Failed to parse Ollama response', [
                'restaurant_id' => $restaurant->id,
                'response' => $response,
            ]);
            return null;
        }

        return [
            'text' => $parsed['text'],
            'good_points' => $parsed['good_points'],
            'bad_points' => $parsed['bad_points'],
            'review_count' => $reviewCount,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Ollama に送るプロンプトを構築する
     */
    private function buildPrompt(string $reviewTexts, int $reviewCount): string
    {
        return <<<PROMPT
あなたはレストランのレビュー要約を生成するアシスタントです。
以下の{$reviewCount}件のレビューを分析し、JSON形式で要約を返してください。

【レビュー一覧】
{$reviewTexts}

【出力形式】
以下のJSON形式のみを出力してください。JSON以外のテキストは含めないでください。
```json
{
  "text": "レビュー全体の要約文（2〜3文、自然な日本語で）",
  "good_points": ["良い点1", "良い点2"],
  "bad_points": ["気になる点1", "気になる点2"]
}
```

【ルール】
- textは自然な日本語の文章にすること
- good_pointsは高評価レビューから読み取れるポジティブな特徴を簡潔に（最大3つ）
- bad_pointsは低評価レビューから読み取れるネガティブな特徴を簡潔に（最大3つ）
- 低評価レビューがない場合、bad_pointsは空配列にすること
- JSON以外の説明文は一切出力しないこと
PROMPT;
    }

    /**
     * Ollama の応答からJSONをパースする
     */
    private function parseResponse(string $response): ?array
    {
        // ```json ... ``` ブロックがある場合は中身を抽出
        if (preg_match('/```json\s*(.*?)\s*```/s', $response, $matches)) {
            $json = $matches[1];
        } else {
            $json = $response;
        }

        // 前後の余分な文字を除去
        $json = trim($json);

        $decoded = json_decode($json, true);

        if (!is_array($decoded)) {
            return null;
        }

        // 必須キーの存在チェック
        if (!isset($decoded['text']) || !isset($decoded['good_points']) || !isset($decoded['bad_points'])) {
            return null;
        }

        // 型の正規化
        return [
            'text' => (string) $decoded['text'],
            'good_points' => array_values(array_map('strval', (array) $decoded['good_points'])),
            'bad_points' => array_values(array_map('strval', (array) $decoded['bad_points'])),
        ];
    }
}
