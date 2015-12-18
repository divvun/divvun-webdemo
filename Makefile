TARGETS = build/app.js build/style.css build/index.html

all: $(TARGETS)
	flow

build/.d:
	test -d build || mkdir build
	touch "$@"

build/app.js: app.js build/.d
	flow check app.js
	closure-compiler \
			 --warning_level VERBOSE			\
			 --js "$<"					\
			 --js_output_file "$@"

# TODO: closure-compiler still warns about a lot of this one:
build/jquery-externs.js: build/.d
	wget "https://github.com/google/closure-compiler/raw/master/contrib/externs/jquery-1.9.js" -O "$@"

build/%: % build/.d
	cp "$<" "$@"

clean:
	rm -rf build
