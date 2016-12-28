var diff = require('diff'),
	fs = require('fs'),
	directory = './output/',
	firstResponseHeader = null; //this last one is ugle. nasty pattern.

var compareObj = function(requestAll1, requestAll2) { 
	var identical = true;
	//I have assumed (yup) that 
	requestDetails1 = requestAll1[0];
	requestDetails2 = requestAll2[0];
	responseHeaders1 = requestAll1[1];
	responseHeaders2 = requestAll2[1];
	if(requestDetails1['details']['path'] != requestDetails2['details']['path']) {
		console.log("CRITICAL ERROR: assumed paths would be the same but they are not. We aren't comparing urls that just differ by domain.  Could be ordering maybe. " + 
			JSON.stringify(requestDetails1['details']) + ',' + JSON.stringify(requestDetails2['details']));
	} else {
		console.log('NEW COMPARISON ' + requestDetails1['details']['path'] + ',' + requestDetails1['details']['domain'] + ',' + requestDetails2['details']['domain']);
		for (var key in responseHeaders1) {//not, currently missing iteration ove responseHeaders2
			if (responseHeaders1.hasOwnProperty(key) && responseHeaders2.hasOwnProperty(key)) {
				if(responseHeaders1[key] != responseHeaders2[key]){
					console.log('DIFFERENCE: ' + key + ':' + responseHeaders1[key] + ',' + responseHeaders2[key]);
					identical = false;
				}
			} else if(responseHeaders1.hasOwnProperty(key)) {
				console.log('DIFFERENCE In 1 but not 2 ' + key + ':' + responseHeaders1[key] );
				identical = false;
			} else if(responseHeaders2.hasOwnProperty(key)) {
				console.log('DIFFERENCE In 2 but not 1 ' + key + ':' + responseHeaders2[key] );
				identical = false;
			} else {
				console.log("shouldn't be possible. Neither has a value for a value found.");
			}
	    }
	    if(identical){
	    	console.log('RESPONSES IDENTICAL');    	
	    }
	}
}; 

fs.readdir(directory, (err, files) => {
	var firstFile = true;
	files.forEach(file => {
		//I'm assuming a certain order which is bad
		//and this is an ugly way to do this.
		//but i'm trying to avoid building a large object in memory for now so...
		var fileLookingFor = file.indexOf('details_') == 0;
		//parseInt(file.substring(file.lastIndexOf('_') + 1)); //assume less than 10 domains and later specifically 2
		if (!fileLookingFor){
			console.log('file not as expected. Ignoring : ' + file);
		} else if(firstFile){
			firstResponseHeader = fs.readFileSync(directory + file);
			firstFile = false;
		} else if(!firstFile){
			var secondResponseHeader = fs.readFileSync(directory + file);
			var differences = compareObj(JSON.parse(firstResponseHeader), JSON.parse(secondResponseHeader));
			firstFile = true;
 		}
	});
})

