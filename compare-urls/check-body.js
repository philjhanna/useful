var diff = require('diff'),
	files = [],
	fs = require('fs'),
	needle = require('needle'),
	directory = 'output/',
	urls = [
		'http://eatyrghost.com/ajax/us-states',
		'http://eatyrghost.com/ajax/step-1',
		'http://eatyrghost.com/ajax/step-2',
		'http://eatyrghost.com/ajax/step-3',
		'http://eatyrghost.com/ajax/slides'
	];

urls.forEach(function (url, index) {
	needle.get(url, function (err, resp, body) {
		if (!err && resp.statusCode === 200) {
			if (typeof body === 'object' && body !== null) {
				body = JSON.stringify(body);
			}
			var name = directory + url.substring(url.lastIndexOf('/') + 1) + '.txt';
			fs.writeFile(name, body, function (fErr) {});
			files.push(name);
		}
	});
});