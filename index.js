'use strict';
var tempWrite = require('temp-write'),
		PluginError = require('gulp-util').PluginError,
		cc = require('closurecompiler'),
		transform = require('parallel-transform'),
		cpus = require('os').cpus().length,
		reErrorParse = /^.*:(\d+):\W(.*?)\n(?:.|\n)*(\d+)\Werror.*(\d+)\Wwarning/;

module.exports = function(opts) {
	opts = opts || {};

	function minify(file, callback) {
		if (file.isNull()) {
			return callback(null, file);
		}

		if (file.isStream()) {
			return callback(new PluginError('gulp-closure', 'Streaming not supported'));
		}

		tempWrite(file.contents).then(function(tempFile) {
			cc.compile(tempFile, opts, function(err, data) {
				if (err && !data) {
					var parsed = reErrorParse.exec(err);
					callback(new PluginError('gulp-closure', parsed[2], {
							fileName: file.path,
							lineNumber: +parsed[1],
							showStack: false
						}));

					return;
				}

				file.contents = new Buffer(data);

				callback(null, file);
			});
		})['catch'](function(err) {
			callback(new PluginError('gulp-closure', err, {
				fileName: file.path,
				showStack: false
			}));
		});
	}

	return transform(opts.parallism || cpus, minify);
};
