HAVE_YARN != command -v yarn 2>/dev/null
ifdef HAVE_YARN
PM=yarn
else
PM=npm
endif
yarn_INSTALL_ARGS=--ignore-optional
npm_INSTALL_ARGS=--no-optional

all:
	$(PM) run build --production

deps:
	$(PM) install $($(PM)_INSTALL_ARGS)

check:
	flow check app.js
	test -d tmp || mkdir tmp
	closure-compiler				\
			 --warning_level VERBOSE	\
			 --js src/app.js		\
			 --js_output_file tmp/app.closure.js
