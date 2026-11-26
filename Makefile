.PHONY: install lint test e2e serve

install:
	npm ci

lint:
	npm run format:check
	npm run lint
	npm run lint:html
	npm run typecheck

test:
	npm run test:coverage

e2e:
	npx playwright install chromium
	npm run test:e2e

serve:
	npm run serve
