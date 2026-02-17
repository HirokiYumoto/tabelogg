<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaService
{
    protected string $host;
    protected string $model;

    public function __construct()
    {
        $this->host = config('services.ollama.host', 'http://host.docker.internal:11434');
        $this->model = config('services.ollama.model', 'qwen2.5:7b');
    }

    /**
     * Ollama API にプロンプトを送信してテキスト応答を取得する
     */
    public function generate(string $prompt): ?string
    {
        try {
            $response = Http::timeout(120)
                ->post("{$this->host}/api/generate", [
                    'model' => $this->model,
                    'prompt' => $prompt,
                    'stream' => false,
                ]);

            if ($response->successful()) {
                return $response->json('response');
            }

            Log::error('Ollama API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Ollama API exception', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
