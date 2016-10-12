all:
	npm run build --production

deps:
	npm install --no-optional

check:
	flow check app.js
	test -d tmp || mkdir tmp
	closure-compiler \
			 --warning_level VERBOSE			\
			 --js src/app.js					\
			 --js_output_file tmp/app.closure.js
