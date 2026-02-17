FROM php:8.2-fpm

# 環境変数の設定
ENV TZ=Asia/Tokyo

# Laravelに必要なパッケージをインストール
RUN apt-get update && \
    apt-get install -y git unzip libzip-dev libicu-dev libonig-dev && \
    docker-php-ext-install intl pdo_mysql zip bcmath

# php.iniをコピー
COPY ./php.ini /usr/local/etc/php/php.ini

# Composerのインストール
COPY --from=composer:2.2 /usr/bin/composer /usr/bin/composer

WORKDIR /data

# Node.jsとnpmをインストール（公式イメージからコピー）
COPY --from=node:20-bullseye /usr/local/bin /usr/local/bin
COPY --from=node:20-bullseye /usr/local/lib /usr/local/lib