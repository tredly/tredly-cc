'use strict';

var _ = require('lodash');
var co = require('co');
var koa = require('koa');
var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');
var url = require('url');
var querystring = require('querystring');
var request = require('request');
var httpProxy = require('http-proxy');
var koaCors = require('koa-cors');
var koaSendFile = require('koa-sendfile');
var koaStatic = require('koa-static');
var parse = require('co-busboy');

process.on('uncaughtException', function (p) {
    console.log('Error: ', p);
    process.exit(1);
});
process.on('unhandledRejection', function (reason, p) {
    console.log('Error: ', p);
    process.exit(1);
});

var serverUrl = process.env.SERVER_URL || 'cc.example.com';
var ssl = process.env.SSL_FOLDER || path.resolve(__dirname, '.ssl');
var port = process.env.SERVER_PORT || 8089;
var isProd = (process.env.NODE_ENV === 'production');
var publicDir = isProd ? 'public' : 'dist/public';

var app = koa();

app.use(koaCors());

app.use(koaStatic(publicDir));

app.use(function* (next) {
    var self = this;

    if (self.request.path === '/push/files/' || self.request.path === '/push/container/') {

        var stream = yield parse(self);

        yield new Promise (function (resolve, reject) {
            var proxy = request({
                url: url.resolve('https://' + (self.query.host || serverUrl) + ':65223', '/tredly/v1' + self.request.path) +
                    '?' + querystring.stringify({
                        location: self.query.location,
                        partition: self.query.partition
                    }),
                method: 'POST',
                strictSSL: false,
                headers: {
                    'authorization': 'Bearer ' + self.query.token
                }
            }, function (err, response, data) {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });

            stream.pipe(proxy).pipe(self.res);
        });

    } else {
        yield next;
    }
});


app.use(function* (next) {
    var self = this;

    if (self.request.url.indexOf('/tredly/') !== 0) {
        //self.redirect('/#' + self.request.url);
        yield koaSendFile(self, path.resolve(publicDir, 'index.html'));
        return;
    }

    yield new Promise(function(resolve, reject) {

        var proxy = httpProxy.createProxyServer({
            secure: false
        });

        proxy.on('error', function (err) {
            console.log('Proxy Error: ', err);
            reject(err);
        });

        proxy.on('end', function () {
            resolve();
        });

        proxy.web(self.req, self.res, {
            target: 'https://' + (self.headers['x-tredly-api-host'] || serverUrl) + ':65223'
        });
    });
});

var callback = app.callback();

var server = null;


if (!isProd) {
    server = http.createServer(callback);
} else {
    port = 443;

    var options = {
        key: fs.readFileSync(path.resolve(ssl, './server.key')),
        cert: fs.readFileSync(path.resolve(ssl, './server.crt'))
    };

    server = https.createServer(options, callback);
}

server.listen(port);

server.timeout = 180 * 60 * 1000;

console.log('Listening port - ', port);
