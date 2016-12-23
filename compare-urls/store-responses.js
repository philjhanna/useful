var files = [],
	fs = require('fs'),
	needle = require('needle'),
	directory = './output/',
	paths = [
		'/',
		'/our-picks.html',
		'/stocks.html'
	],
	domains = [
		'http://www-stg.morningstar.com',
		'http://www-qa.morningstar.com'
	];


paths.forEach(function (paths, indexPaths) {
	domains.forEach(function (domains, indexDomains) {
		needle.get(domains + paths, function (err, resp, body) {
			var name = directory + indexPaths + '-' + indexDomains + '.txt';
			console.log(name + " " + domains + paths);
			fs.writeFile(name, JSON.stringify(resp.headers), function (fErr) {});
			files.push(name); //wathc the memory here, could get big and so far we don't need it.
		});
	});


});

