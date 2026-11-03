# syntax=docker/dockerfile:1
# One image for the whole app: Vite builds the React UI, Rails serves it and the API.
#   docker build -t salary-manager .
#   docker run -p 3000:3000 -e SECRET_KEY_BASE=$(openssl rand -hex 64) salary-manager
# On first boot the entrypoint runs db:prepare, which creates the SQLite database
# and seeds 10,000 employees.

ARG RUBY_VERSION=3.4.11

# --- 1. Frontend build -------------------------------------------------------
FROM node:22-slim AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# --- 2. Ruby base ------------------------------------------------------------
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base
WORKDIR /rails
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libjemalloc2 sqlite3 && \
    ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development" \
    LD_PRELOAD="/usr/local/lib/libjemalloc.so"

# --- 3. Gems and app code ----------------------------------------------------
FROM base AS build
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives
COPY backend/Gemfile backend/Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile -j 1 --gemfile
COPY backend/ ./
# Hashed assets go to public/ (long-cached by Rails); the HTML shell is renamed
# so Rails' static server doesn't serve it at "/" with that same long cache.
COPY --from=frontend /frontend/dist/ ./public/
RUN mv public/index.html public/app.html && \
    bundle exec bootsnap precompile -j 1 app/ lib/ && \
    chmod +x bin/* && sed -i "s/\r$//g" bin/* && sed -i 's/ruby\.exe$/ruby/' bin/*

# --- 4. Runtime image --------------------------------------------------------
FROM base
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash
USER 1000:1000
COPY --chown=rails:rails --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --chown=rails:rails --from=build /rails /rails
ENTRYPOINT ["/rails/bin/docker-entrypoint"]
EXPOSE 3000
CMD ["./bin/rails", "server"]
