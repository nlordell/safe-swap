.PHONY: all
all: build

.PHONY: host
host: build
	npm run serve

.PHONY: build
build: dist/index.js dist/index.html dist/manifest.json

dist/index.html: src/index.html dist/index.js
	cat src/index.html \
		| sed '\#<script data-src="index.js">#r dist/index.js' \
		| sed '\#<style data-src="index.css">#r dist/index.css' \
		> dist/index.html
	
dist/index.js: bundle.js \
			   src/index.js src/shim.js \
			   src/api/chain.js src/api/cow.js src/api/safe.js \
			   src/components/App.svelte src/components/Header.svelte \
			   src/components/History.svelte src/components/Order.svelte
	npm run bundle
	@touch dist/index.js

dist/manifest.json: src/manifest.json
	mkdir -p dist
	cp $< $@
