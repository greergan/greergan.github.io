# =============================================================
# Makefile — Terminal Blog Static Site Generator
# Targets: make (build), make bootstrap (first-time setup), make update (get latest generate.js), make clean
# =============================================================

REPO_RAW     = https://raw.githubusercontent.com/greergan/static-blog-generator
REPO_API     = https://api.github.com/repos/greergan/static-blog-generator
REPO         = greergan/static-blog-generator

.PHONY: all bootstrap update clean install

# -------------------------------------------------------------
# Default: build the site
# -------------------------------------------------------------
all:
	@if [ ! -f generate.js ]; then \
		echo "[error] generate.js not found — run 'make bootstrap' first, then 'make'"; \
		exit 1; \
	fi
	node generate.js

# -------------------------------------------------------------
# Bootstrap: first-time setup — downloads latest tag zip,
# extracts and copies files; skips existing; runs npm install
# -------------------------------------------------------------
bootstrap:
	@if [ -f generate.js ]; then \
		echo "[bootstrap] already bootstrapped — run 'make update' to update generate.js"; \
		exit 0; \
	fi
	@echo "[bootstrap] fetching latest tag..."
	@LATEST_TAG=$$(curl -fsSL "$(REPO_API)/tags" 2>/dev/null | grep '"name"' | head -1 | sed 's/.*"name": *"\(.*\)".*/\1/'); \
	if [ -z "$$LATEST_TAG" ]; then \
		echo "[bootstrap] no tags found — cannot bootstrap"; \
		exit 1; \
	fi; \
	echo "[bootstrap] using tag: $$LATEST_TAG"; \
	ZIP_URL="https://github.com/$(REPO)/archive/refs/tags/$$LATEST_TAG.zip"; \
	echo "[bootstrap] downloading $$ZIP_URL..."; \
	curl -fsSL "$$ZIP_URL" -o /tmp/repo.zip; \
	rm -rf /tmp/repo_extract; \
	unzip -q /tmp/repo.zip -d /tmp/repo_extract; \
	EXTRACT_DIR=$$(ls /tmp/repo_extract/); \
	echo "[bootstrap] copying files (skipping existing)..."; \
	find /tmp/repo_extract/$$EXTRACT_DIR -type f | while read src; do \
		rel=$${src#/tmp/repo_extract/$$EXTRACT_DIR/}; \
		case "$$rel" in .gitignore|README.md) continue ;; esac; \
		if [ ! -f "$$rel" ]; then \
			mkdir -p "$$(dirname $$rel)"; \
			echo "[bootstrap] copying $$rel"; \
			cp "$$src" "$$rel"; \
		else \
			echo "[bootstrap] skipping $$rel (already exists)"; \
		fi; \
	done; \
	rm -rf /tmp/repo.zip /tmp/repo_extract
	@echo "[bootstrap] running npm install..."
	@npm install
	@echo "[bootstrap] done"

# -------------------------------------------------------------
# Update: fetch latest tag, compare to local package.json
# downloads generate.js only if remote tag is newer
# -------------------------------------------------------------
update:
	@echo "[update] checking latest tag..."
	@REMOTE_TAG=$$(curl -fsSL "$(REPO_API)/tags" 2>/dev/null | grep '"name"' | head -1 | sed 's/.*"name": *"\(.*\)".*/\1/'); \
	if [ -z "$$REMOTE_TAG" ]; then \
		echo "[update] no tags found on remote — cannot update"; \
		exit 1; \
	fi; \
	echo "[update] remote tag: $$REMOTE_TAG"; \
	LOCAL_VERSION=$$(node -e "try{process.stdout.write(require('./package.json').version)}catch(e){process.stdout.write('')}" 2>/dev/null); \
	echo "[update] local version: $$LOCAL_VERSION"; \
	if [ "v$$LOCAL_VERSION" = "$$REMOTE_TAG" ] || [ "$$LOCAL_VERSION" = "$$REMOTE_TAG" ]; then \
		echo "[update] already up to date"; \
	else \
		echo "[update] downloading generate.js @ $$REMOTE_TAG..."; \
		curl -fsSL "$(REPO_RAW)/$$REMOTE_TAG/generate.js" -o generate.js; \
		echo "[update] done — generate.js updated to $$REMOTE_TAG"; \
	fi

# -------------------------------------------------------------
# Clean: remove dist/
# -------------------------------------------------------------
clean:
	rm -rf dist/
	@echo "[clean] dist/ removed"

# -------------------------------------------------------------
# Install: sync dist/ into ../blog using rsync
# -------------------------------------------------------------
install:
	@if [ ! -d dist ]; then \
		echo "[error] dist/ not found — run 'make' first"; \
		exit 1; \
	fi
	rsync -a --delete dist/ ../blog/
	@echo "[install] ../blog synced from dist/"
