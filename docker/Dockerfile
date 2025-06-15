# ===============================
# 開発ステージ
FROM node:latest AS dev-container
# 作業ディレクトリ設定
WORKDIR /workspace

# ===============================
# 開発ビルドステージ
FROM node:latest AS development-build

# 作業ディレクトリ設定
WORKDIR /workspace
COPY . .
RUN npm ci
RUN npm install -g eas-cli

CMD ["eas", "build", "--profile", "development"]

# ===============================
# プレビュービルドステージ
FROM node:latest AS preview-build

# 作業ディレクトリ設定
WORKDIR /workspace
COPY . .
RUN npm ci
RUN npm install -g eas-cli

CMD ["eas", "build", "--profile", "preview"]
