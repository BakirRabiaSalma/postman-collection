var expect = require('expect.js'),
    UrlMatchPattern = require('../../lib/url-pattern/url-match-pattern').UrlMatchPattern,
    URL = require('../../lib/collection/url').Url,

    // return a target to run specs on
    getTargetForSpec = function (matchPatternString) {
        return new UrlMatchPattern(matchPatternString);
    },

    nodeVersion = process.env.TRAVIS_NODE_VERSION, // eslint-disable-line no-process-env
    runningOnTravis = process.env.TRAVIS, // eslint-disable-line no-process-env

    // to skip particular tests when running on travis with node version 4.x
    travisNodeV4Skip = (runningOnTravis && nodeVersion.match(/^v4./)) ? describe.skip : describe,

    // Run tests for Url matching on test method of a given target
    // Reason for doing this here is, so the same tests can be run on
    // UrlMatchPattern and UrlMatchPatternList
    specForTestMethodOnTarget = function (getTargetForSpec) {
        it('should exit safely with false, when compared against invalid Url', function () {
            var matchPattern = getTargetForSpec('http://*/*');
            expect(matchPattern.test('google')).to.eql(false);
        });

        it('should match all urls for <all_urls>', function () {
            var matchPattern = getTargetForSpec('<all_urls>');
            expect(matchPattern.test('http://www.google.com/')).to.eql(true);
            expect(matchPattern.test('http://foo.bar.com/')).to.eql(true);
        });

        it('should match all sdk Url provided', function () {
            var matchPattern = getTargetForSpec('<all_urls>');
            expect(matchPattern.test(new URL('http://www.google.com/'))).to.eql(true);
            expect(matchPattern.test(new URL('http://foo.bar.com/'))).to.eql(true);
        });

        it('should parse any URL that uses the http protocol', function () {
            var matchPattern = getTargetForSpec('http://*/*');
            expect(matchPattern.test('http://www.google.com/')).to.eql(true);
            expect(matchPattern.test('http://foo.bar.com/')).to.eql(true);
        });

        it('should parse any URL that uses the http protocol, on any host, with path starts with /foo', function () {
            var matchPattern = getTargetForSpec('http://*/foo*');
            expect(matchPattern.test('http://example.com/foo/bar.html')).to.eql(true);
            expect(matchPattern.test('http://www.google.com/foo')).to.eql(true);
        });

        it('should parse any URL that uses the https protocol, is on a google.com host', function () {
            var matchPattern = getTargetForSpec('http://*/foo*');
            expect(matchPattern.test('http://www.google.com/foo/baz/bar')).to.eql(true);
            expect(matchPattern.test('http://docs.google.com/foobar')).to.eql(true);
        });

        it('should parse any URL that uses the http protocol and is on the host 127.0.0.1', function () {
            var matchPattern = getTargetForSpec('http://127.0.0.1/*');
            expect(matchPattern.test('http://127.0.0.1/')).to.eql(true);
            expect(matchPattern.test('http://127.0.0.1/foo/bar.html')).to.eql(true);
        });

        it('should parse any URL that uses the http protocol and is on the host ends with 0.0.1', function () {
            var matchPattern = getTargetForSpec('http://*.0.0.1/');
            expect(matchPattern.test('http://127.0.0.1/')).to.eql(true);
            expect(matchPattern.test('http://125.0.0.1/')).to.eql(true);
        });

        it('should parse any URL which has host mail.google.com', function () {
            var matchPattern = getTargetForSpec('*://mail.google.com/*');
            expect(matchPattern.test('http://mail.google.com/foo/baz/bar')).to.eql(true);
            expect(matchPattern.test('https://mail.google.com/foobar')).to.eql(true);
        });

        it('Bad Match pattern [No Path]', function () {
            var matchPattern = getTargetForSpec('http://www.google.com');
            expect(matchPattern.test('http://www.google.com')).to.eql(false);
        });

        it('Bad Match pattern ["*" in the host can be followed only by a "." or "/"]', function () {
            var matchPattern = getTargetForSpec('http://*foo/bar');
            expect(matchPattern.test('http://*foo.com')).to.eql(false);
        });

        it('Bad Match pattern [If "*" is in the host, it must be the first character]', function () {
            var matchPattern = getTargetForSpec('http://foo.*.bar/baz');
            expect(matchPattern.test('http://foo.z.bar/baz')).to.eql(false);
        });

        it('Bad Match pattern [Missing protocol separator ("/" should be "//")]', function () {
            var matchPattern = getTargetForSpec('http:/bar');
            expect(matchPattern.test('http:/bar.com')).to.eql(false);
        });

        it('Bad Match pattern [Invalid protocol', function () {
            var matchPattern = getTargetForSpec('foo://*');
            expect(matchPattern.test('foo://www.google.com')).to.eql(false);
        });

        it('should extract multiple protocols', function () {
            var matchPatternObject = new UrlMatchPattern('http+https+ftp+file://*/*').createMatchPattern();
            expect(matchPatternObject.protocols).to.eql(['http', 'https', 'ftp', 'file']);
        });

        it('should not match if any one of multiple protocols are invalid', function () {
            var matchPatternObject = new UrlMatchPattern('http+foo+ftp://*/*').createMatchPattern();
            expect(matchPatternObject).to.eql(undefined);
        });
    };

console.log({
    nodeVersion: nodeVersion,
    runningOnTravis: runningOnTravis,
    regexMatch: nodeVersion.match(/^v4./),
    finalCondition: (runningOnTravis && nodeVersion.match(/^v4./)),
    travisNodeV4Skip: travisNodeV4Skip
});

describe('UrlMatchPattern', function () {
    describe('constructor', function () {
        it('should set match pattern to <all_urls> when called with no arguments', function () {
            var matchPattern = new UrlMatchPattern();
            expect(matchPattern.toString()).to.eql('<all_urls>');
        });
        it('should accept match pattern as string', function () {
            var pattern = 'http://example.com/*',
                matchPattern = new UrlMatchPattern(pattern);
            expect(matchPattern.toString()).to.eql(pattern);
        });
        it('should accept match pattern as object', function () {
            var pattern = 'http://example.com/*',
                constructorOptions = { pattern: pattern },
                matchPattern = new UrlMatchPattern(constructorOptions);
            expect(matchPattern.toString()).to.eql(pattern);
        });
    });
    describe('globPatternToRegexp', function () {
        it('should escapes the regx releated characters', function () {
            var pattern = '[.+^${}()[]',
                convertedPattern = new UrlMatchPattern().globPatternToRegexp(pattern);
            expect(convertedPattern).to.eql(/^\[\.\+\^\$\{\}\(\)\[\]$/); // eslint-disable-line no-useless-escape
        });

        it('should change ? to .', function () {
            var pattern = '?foo',
                convertedPattern = new UrlMatchPattern().globPatternToRegexp(pattern);
            expect(convertedPattern).to.eql(/^.foo$/);
        });

        it('should change * to .*', function () {
            var pattern = '*foo',
                convertedPattern = new UrlMatchPattern().globPatternToRegexp(pattern);
            expect(convertedPattern).to.eql(/^.*foo$/);
        });

        travisNodeV4Skip('security', function () {
            describe('ReDoS', function () {
                this.timeout(1500);

                var specials = ['.', '+', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\'];

                it('should be thwarted for long patterns', function () {
                    var pattern = specials.join('a'.repeat(3e6)),
                        convertedPattern = new UrlMatchPattern().globPatternToRegexp(pattern);

                    expect(convertedPattern.toString()).to.have.length(33000028);
                });
            });
        });
    });

    describe('createMatchPattern', function () {
        it('should exit with undefined when invoked with an invalid matchPattern', function () {
            var matchPatternObject = new UrlMatchPattern().createMatchPattern();
            expect(matchPatternObject).to.eql(undefined);

            matchPatternObject = new UrlMatchPattern({}).createMatchPattern();
            expect(matchPatternObject).to.eql(undefined);
        });

        it('should extract single protocol', function () {
            var matchPatternObject = new UrlMatchPattern('http://*/*').createMatchPattern();
            expect(matchPatternObject.protocols).to.eql(['http']);
            matchPatternObject = new UrlMatchPattern('https://*/*').createMatchPattern();
            expect(matchPatternObject.protocols).to.eql(['https']);
            matchPatternObject = new UrlMatchPattern('ftp://*/*').createMatchPattern();
            expect(matchPatternObject.protocols).to.eql(['ftp']);
            matchPatternObject = new UrlMatchPattern('file://*/*').createMatchPattern();
            expect(matchPatternObject.protocols).to.eql(['file']);
            matchPatternObject = new UrlMatchPattern('*://*/*').createMatchPattern();
            expect(matchPatternObject.protocols).to.eql(['*']);
        });

        it('should parse any URL that uses the http protocol', function () {
            var matchPatternObject = new UrlMatchPattern('http://*/*').createMatchPattern();
            expect(matchPatternObject.protocols).to.eql(['http']);
            expect(matchPatternObject.host).to.eql('*');
            expect(matchPatternObject.path).to.eql(/^\/.*$/);
        });

        it('should parse any URL that uses the http protocol, on any host, with path starts with /foo', function () {
            var matchPatternObject = new UrlMatchPattern('http://*/foo*').createMatchPattern();
            expect(matchPatternObject.protocols).to.eql(['http']);
            expect(matchPatternObject.host).to.eql('*');
            expect(matchPatternObject.path).to.eql(/^\/foo.*$/);
        });

        it('should parse any URL that uses the https protocol, is on a google.com host', function () {
            var matchPatternObject = new UrlMatchPattern('http://*.google.com/foo*bar').createMatchPattern();
            expect(matchPatternObject.protocols).to.eql(['http']);
            expect(matchPatternObject.host).to.eql('*.google.com');
            expect(matchPatternObject.path).to.eql(/^\/foo.*bar$/);
        });

        it('should parse any URL that uses the http protocol and is on the host 127.0.0.1', function () {
            var matchPatternObject = new UrlMatchPattern('http://127.0.0.1/*').createMatchPattern();
            expect(matchPatternObject.protocols).to.eql(['http']);
            expect(matchPatternObject.host).to.eql('127.0.0.1');
            expect(matchPatternObject.path).to.eql(/^\/.*$/);
        });

        it('should parse any URL that uses the http protocol and is on the host ends with 0.0.1', function () {
            var matchPatternObject = new UrlMatchPattern('http://*.0.0.1/').createMatchPattern();
            expect(matchPatternObject.protocols).to.eql(['http']);
            expect(matchPatternObject.host).to.eql('*.0.0.1');
            expect(matchPatternObject.path).to.eql(/^\/$/);
        });

        it('should parse any URL which has host mail.google.com', function () {
            var matchPatternObject = new UrlMatchPattern('*://mail.google.com/*').createMatchPattern();
            expect(matchPatternObject.protocols).to.eql(['*']);
            expect(matchPatternObject.host).to.eql('mail.google.com');
            expect(matchPatternObject.path).to.eql(/^\/.*$/);
        });

        it('Bad Match pattern [No Path]', function () {
            var matchPatternObject = new UrlMatchPattern('http://www.google.com').createMatchPattern();
            expect(matchPatternObject).to.eql(undefined);
        });

        it('Bad Match pattern ["*" in the host can be followed only by a "." or "/"]', function () {
            var matchPatternObject = new UrlMatchPattern('http://*foo/bar').createMatchPattern();
            expect(matchPatternObject).to.eql(undefined);
        });

        it('Bad Match pattern [If "*" is in the host, it must be the first character]', function () {
            var matchPatternObject = new UrlMatchPattern('http://foo.*.bar/baz').createMatchPattern();
            expect(matchPatternObject).to.eql(undefined);
        });

        it('Bad Match pattern [Missing protocol separator ("/" should be "//")]', function () {
            var matchPatternObject = new UrlMatchPattern('http:/bar').createMatchPattern();
            expect(matchPatternObject).to.eql(undefined);
        });

        it('Bad Match pattern [Invalid protocol', function () {
            var matchPatternObject = new UrlMatchPattern('foo://*').createMatchPattern();
            expect(matchPatternObject).to.eql(undefined);
        });
    });

    describe('testProtocol', function () {
        it('should check for protocol in matchPatternObject and returns false for http', function () {
            var matchPattern = new UrlMatchPattern('https://*/*');

            expect(matchPattern.testProtocol('http')).to.eql(false);
            expect(matchPattern.testProtocol('https')).to.eql(true);
        });
    });

    describe('testPath', function () {
        it('should allow /foo and /bar for /*', function () {
            var matchPattern = new UrlMatchPattern('*://*/*');

            expect(matchPattern.testPath('/foo')).to.eql(true);
            expect(matchPattern.testPath('/bar')).to.eql(true);
            expect(matchPattern.testPath('/')).to.eql(true);
        });

        it('should allow only /foo and similar paths for /foo*', function () {
            var matchPattern = new UrlMatchPattern('*://*/foo*');

            expect(matchPattern.testPath('/foo')).to.eql(true);
            expect(matchPattern.testPath('/foo1')).to.eql(true);
            expect(matchPattern.testPath('/foo/bar')).to.eql(true);
            expect(matchPattern.testPath('/bar')).to.eql(false);
        });
    });

    describe('testHost', function () {
        it('should match any host', function () {
            var matchPattern = new UrlMatchPattern('*://*/*'),
                anyhost = matchPattern.testHost(new URL('randomhost.com').getRemote());
            expect(anyhost).to.eql(true);
        });

        it('should match host starts with any and have suffix as if in the pattern', function () {
            var matchPattern = new UrlMatchPattern('https://*.foo.com/*'),
                hostMatched = matchPattern.testHost(new URL('bar.foo.com').getRemote());
            expect(hostMatched).to.eql(true);
        });

        it('should match host ends with a suffix as if in the pattern', function () {
            var matchPattern = new UrlMatchPattern('https://*.foo.com/*'),
                hostMatched = matchPattern.testHost(new URL('foo.com').getRemote());
            expect(hostMatched).to.eql(true);
        });

        it('should match host with exact as like in match', function () {
            var matchPattern = new UrlMatchPattern('*://foo.com/*'),
                hostMatched = matchPattern.testHost(new URL('foo.com').getRemote());
            expect(hostMatched).to.eql(true);
        });
    });

    describe('test', function () {
        specForTestMethodOnTarget(getTargetForSpec);
        it('should update internal caches between pattern switches', function () {
            var matchPattern = new UrlMatchPattern('http://foo.com/*'),
                urlMatched = matchPattern.test('http://foo.com');
            expect(urlMatched).to.eql(true);

            matchPattern.update({ pattern: 'http://foo.com/bar*' });
            urlMatched = matchPattern.test('http://foo.com');
            expect(urlMatched).to.eql(false);
            urlMatched = matchPattern.test('http://foo.com/bar');
            expect(urlMatched).to.eql(true);

        });
    });

    describe('toString', function () {
        it('should have same match pattern', function () {
            var pattern = 'https://example.com/*',
                matchPattern = new UrlMatchPattern(pattern);
            expect(matchPattern.toString()).to.eql(pattern);
        });
        it('should always return string', function () {
            var matchPattern = new UrlMatchPattern(undefined);
            expect(typeof matchPattern.toString()).to.eql('string');
            matchPattern = new UrlMatchPattern({});
            expect(typeof matchPattern.toString()).to.eql('string');
            matchPattern = new UrlMatchPattern([]);
            expect(typeof matchPattern.toString()).to.eql('string');
            matchPattern = new UrlMatchPattern(true);
            expect(typeof matchPattern.toString()).to.eql('string');
            matchPattern = new UrlMatchPattern('');
            expect(typeof matchPattern.toString()).to.eql('string');
        });
    });

    describe('toJSON', function () {
        it('should retain match pattern after toJSON', function () {
            var pattern = 'https://example.com/*',
                matchPattern = new UrlMatchPattern(pattern);
            expect(matchPattern.toJSON()).to.eql({ pattern: pattern });
        });
    });
});

module.exports = {
    specForTestMethodOnTarget: specForTestMethodOnTarget
};
