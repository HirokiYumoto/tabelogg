FROM mysql/mysql-server:8.0

ENV TZ=Asia/Tokyo

# DB名・ユーザー名・パスワードは docker-compose.yml の env_file 経由で注入
# ローカルではデフォルト値を使用、本番では .env で上書き
ENV MYSQL_DATABASE=${MYSQL_DATABASE:-laravel} \
    MYSQL_USER=${MYSQL_USER:-phper} \
    MYSQL_PASSWORD=${MYSQL_PASSWORD:-secret} \
    MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-secret}

COPY ./my.cnf /etc/my.cnf
RUN chmod 644 /etc/my.cnf