var diff = require('diff'),
	files = [],
	fs = require('fs'),
	needle = require('needle'),
	directory = 'output/',
	paths = [
		'/',
		'/our-picks.html'
	],
	domains = [
		'http://www.morningstar.com',
		'http://beta.morningstar.com'
	];


paths.forEach(function (paths, indexPaths) {
	domains.forEach(function (domains, indexDomains) {
		needle.get(domains + paths, function (err, resp, body) {
			//if (!err && resp.statusCode === 200) {
				//var name = url.substring(url.lastIndexOf('/') + 1) + '.txt';
				var name = directory + indexPaths + '-' + indexDomains + '.txt';
				console.log(name + " " + domains + paths);
				fs.writeFile(name, JSON.stringify(resp.headers), function (fErr) {});
				files.push(name);
			//}
		});
	});
});