var diff = require('diff'),
	fs = require('fs'),
	directory = './output/',
	firstResponseHeader = null; //this last one is ugle. nasty pattern.

fs.readdir(directory, (err, files) => {
	files.forEach(file => {
		//I'm assuming a certain order which is bad
		//and this is an ugly way to do this.
		//but i'm trying to avoid building a large object in memory for now so...
		domainIndex = parseInt(file.substring(file.lastIndexOf('-') + 1)); //assume less than 10 domains
		console.log(file + ' ' + domainIndex);
		if(domainIndex == 0){
			console.log('attempt read : ' + directory + file);
			firstResponseHeader = fs.readFileSync(directory + file);
		} else if(domainIndex == 1){
			var secondResponseHeader = fs.readFileSync(directory + file);
			console.log('firstResponseHeader: ' + firstResponseHeader);
			console.log('secondResponseHeader: ' + secondResponseHeader);
			var differences = diff.diffJson(firstResponseHeader, secondResponseHeader);
			console.log(differences);
 		} else {
			console.error('file not as expected : ' + file);
		}
	});
})
