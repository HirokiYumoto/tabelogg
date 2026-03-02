<?php

namespace App\Services;

class MeCabService
{
    /**
     * MeCab が正しく読めない複合語の読み補正マップ
     * キー: MeCab が出力する誤った読み、値: 正しい読み
     */
    private const READING_OVERRIDES = [
        'ぶたこつ' => 'とんこつ',
        '拉麺' => 'らーめん',
    ];

    /**
     * MeCab で形態素解析し、読みを取得してひらがなに変換する
     * mecabrc に辞書パスが設定済みなので -d オプションは不要
     */
    public function toReading(string $text): string
    {
        if (trim($text) === '') {
            return '';
        }

        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $process = proc_open('mecab', $descriptors, $pipes);

        if (!is_resource($process)) {
            throw new \RuntimeException('Failed to start MeCab process');
        }

        fwrite($pipes[0], $text);
        fclose($pipes[0]);

        $output = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        $exitCode = proc_close($process);

        if ($exitCode !== 0) {
            throw new \RuntimeException("MeCab exited with code {$exitCode}");
        }

        return $this->parseReadings($output);
    }

    /**
     * テキストをひらがな読みに正規化する
     */
    public function normalize(string $text): string
    {
        $reading = $this->toReading($text);
        $reading = mb_strtolower($reading);
        $reading = str_replace(
            array_keys(self::READING_OVERRIDES),
            array_values(self::READING_OVERRIDES),
            $reading,
        );

        return trim($reading);
    }

    /**
     * MeCab 出力から読みを抽出してひらがなに変換する
     *
     * unidic-lite 出力形式:
     *   表層形\t品詞,品詞細分類1,品詞細分類2,品詞細分類3,原形,読み,追加情報...
     *   読みはインデックス5（すでにひらがなの場合が多い）
     */
    private function parseReadings(string $output): string
    {
        $readings = [];
        $lines = explode("\n", trim($output));

        foreach ($lines as $line) {
            if ($line === 'EOS' || $line === '') {
                continue;
            }

            $parts = explode("\t", $line);
            $surface = $parts[0] ?? '';

            if (!isset($parts[1])) {
                $readings[] = $this->toHiragana($surface);
                continue;
            }

            $fields = explode(',', $parts[1]);
            $reading = isset($fields[5]) ? trim($fields[5]) : '';

            if ($reading !== '' && $reading !== '*' && $reading !== $surface) {
                // 読みが取得できた場合 → ひらがな化
                $readings[] = $this->toHiragana($reading);
            } else {
                // 読み不明 or 表層形と同じ → 表層形をひらがな化（カタカナ→ひらがな変換）
                $readings[] = $this->toHiragana($surface);
            }
        }

        return implode('', $readings);
    }

    /**
     * カタカナ・半角カナをひらがなに変換する
     */
    private function toHiragana(string $text): string
    {
        return mb_convert_kana($text, 'cH');
    }

    /**
     * 文字列が全てかな（ひらがな or カタカナ）かどうか判定する
     */
    private function isKana(string $text): bool
    {
        return (bool) preg_match('/\A[ぁ-ゔァ-ヴー]+\z/u', $text);
    }

}
