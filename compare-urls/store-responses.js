var //files = [],
	fs = require('fs'),
	needle = require('needle'),
	directory = './output/',
	paths = [
		'/',
		'/our-picks.html',
		'/stocks.html'
	],
	domains = [
		'http://beta-stg.morningstar.com/',
		'http://beta-qa.morningstar.com/'
	];

function hashCode(str) {
  return str.split('').reduce((prevHash, currVal) =>
    ((prevHash << 5) - prevHash) + currVal.charCodeAt(0), 0);
}

paths.forEach(function (paths, indexPaths) {
	domains.forEach(function (domains, indexDomains) {
		needle.get(domains + paths, function (err, resp, body) {
			//note: this loop is asynch. These get's will likely not return in the order they were sent.
			var descJSON = '[{"details":{"domain":"' + domains + '","path":"' + paths + '"}}]';
			var name = directory + 'details_' + hashCode(paths) + '_' + hashCode(domains) + '.txt';
			console.log(name + " " + domains + paths);
			fs.writeFile(name, JSON.stringify(JSON.parse(descJSON).concat(resp.headers)), function (fErr) {});
			//files.push(name); //watch the memory here, could get big and so far we don't need it.
		});
	});
});


