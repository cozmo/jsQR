.PHONY: fixtures test

fixtures:
	rm -r fixtures/AUTOGEN
	rm fixtures/fixtures.json
	mkdir fixtures/AUTOGEN
	node_modules/.bin/ts-node --disableWarnings fixtures/generate.ts > fixtures/fixtures.json

test:
	npm test
