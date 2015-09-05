var childProcess = require('child_process');
var fs = require('fs');

var colors = require('colors');

module.exports = function (commands, conf) {
	function clearPids(pidsDir, callback) {
		fs.readdir(pidsDir, function (err, files) {
			if (err) {
				fs.mkdir(pidsDir, function () {
					callback();
				});
			} else {
				var promises = [];
				files.forEach(function (file) {
					promises.push(new Promise(function (resolve, reject, notify) {
						childProcess.exec('kill ' + file, function (error, stdout, stderr) {
							fs.unlink(pidsDir + '/' + file, function (err) {
								resolve();
							});
						});
					}));
				});
				Promise.all(promises).then(function () {
					callback();
				}).catch(function (err) {
					console.log(err);
				});
			}
		});
	}

	function initProcess(command) {
		command.process = childProcess.fork(command.file, [], {
			env: command.env
		});
		fs.writeFile(conf.pidsDir + '/' + command.process.pid, 'master', function () {
		});
		console.log(('new process ' + command.file + ' ' + command.process.pid).green, JSON.stringify(command.env).yellow);
		command.process.on('exit', function () {
			fs.unlink(conf.pidsDir + '/' + command.process.pid, function () {
			});
			console.log(('exit process ' + command.file + ' ' + command.process.pid).red, JSON.stringify(command.env).yellow);
			initProcess(command);
		});
	}

	clearPids(conf.pidsDir, function () {
		fs.writeFile(conf.pidsDir + '/' + process.pid, 'master', function () {
		});
		commands.forEach(initProcess);
	});
};