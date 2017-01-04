var diff = require('diff'),
	fs = require('fs'),
	directory = './output/',
	firstResponseHeader = null; //this last one is ugle. nasty pattern.

function ReqRes(){
	this.domain;
	this.path;
	this.cacheControl;
	this.maxAge;
	this.date;
	this.expires;
	this.lastModified;

}
function CompareReqRes(){
	this.reqRes1 = new ReqRes();
	this.reqRes2 = new ReqRes();
	this.identical = true;
	this.maxAgeAllowedDiffFactor = 10;
	this.processDifferenceXFrameOptions = function (key, value1, value2) {
		if ((value1 == 'SAMEORIGIN, SAMEORIGIN' && value2=='SAMEORIGIN') || (value1 == 'SAMEORIGIN' && value2=='SAMEORIGIN, SAMEORIGIN')) {
			//ignore - we have a misconfigured server I need to fix
		} else {
			this.processDifferenceDefault(key, value1, value2);
		}
	}
	this.processDifferenceCacheControl = function (key, value1, value2) {
		//currently just assuming max-age is present
		maxAgePos1 = value1.indexOf('max-age=');
		maxAgePos2 = value2.indexOf('max-age=');
		if(maxAgePos1 == -1 && maxAgePos2 == -1){
			//some other difference than max-age
			this.processDifferenceDefault(key, value1, value2);
		} else if((maxAgePos1 == -1 && maxAgePos2 != -1) || (maxAgePos2 == -1 && maxAgePos1 != -1) ){
			this.processDifferenceRequired('max-age', key + ':' + value1 + ',' + value2 + ' : max-age present for one but not other');
		} else {
			maxAgeValue1 = parseInt(value1.substring(maxAgePos1 + 8));
			maxAgeValue2 = parseInt(value2.substring(maxAgePos1 + 8));
			if(maxAgeValue1 == maxAgePos2){
				this.processDifferenceRequired('Unsure, found max-age but after extracting they seem the same. extracting failure.', key + ':' + value1 + ',' + value2);
			} else if(maxAgeValue1 == 0 || maxAgeValue2 == 0){
				this.processDifferenceRequired('max-age value', maxAgeValue1 + ',' + maxAgeValue2);
			} else {
				maxAgeDiffFactor = maxAgeValue1 > maxAgeValue2 ? maxAgeValue1/maxAgeValue2 : maxAgeValue2/maxAgeValue1;
				if(maxAgeDiffFactor > this.maxAgeAllowedDiffFactor){
					this.processDifferenceRequired('max-age value', maxAgeValue1 + ',' + maxAgeValue2 + ' difference factor = ' + maxAgeDiffFactor + ' greater that acceptable amount of ' + this.maxAgeAllowedDiffFactor);
				} else {
					//this is NOT a good test.  But I'm going to assume that if the max-ages are similar then we can ignore the difference.
					//max-age's could be dissimilar for valid reasons or similar accidentally. But I need to filter down the results and look for obvious issues.
					//console.log('  DIFFERENCE max-age IGNORE :' + maxAgeValue1 + ',' + maxAgeValue2 + ' : ');
				}
			}
		}
	}
	this.processDifferenceContentLength = function (key, value1, value2) {
		if(value1 != 0 && value2 != 0 && (Math.abs(1 - value1/value2) < 0.02)){
			//ignore as the content-lengths aren't being calculated quite right but normally this would be an indicator we want to show.
		} else {
			this.processDifferenceDefault(key, value1, value2);
		}
	}
	this.processDifferenceDefault = function (key, value1, value2) {
		this.processDifferenceRequired('default', key + ':' + value1 + ',' + value2);
	}
	this.processDifferenceRequired = function (type, message) {
		console.log('  DIFFERENCE ' + type + ': ' + message);
		this.identical = false;
	}
	//ENTRY point for differences
	this.processDifference = function (key, value1, value2) {
		if (value1 == value2) {
			//this is what we want.  No need to output this yet but I may add these.
		} else if (key == 'x-frame-options') {
			this.processDifferenceXFrameOptions(key, value1, value2);
		} else if (key == 'cache-control') {
			this.processDifferenceCacheControl(key, value1, value2);
		} else if (key == 'content-length') {
			this.processDifferenceContentLength(key, value1, value2);
		} else {  
			this.processDifferenceDefault(key, value1, value2);
		}
	}
} 




var compareObj = function(requestAll1, requestAll2) { 
	//I have assumed (yup) that 
	requestDetails1 = requestAll1[0];
	requestDetails2 = requestAll2[0];
	responseHeaders1 = requestAll1[1];
	responseHeaders2 = requestAll2[1];
	compareReqRes = new CompareReqRes();
	compareReqRes.reqRes1.domain = requestDetails1['details']['domain'];
	compareReqRes.reqRes2.domain = requestDetails2['details']['domain'];
	compareReqRes.reqRes1.path = requestDetails1['details']['path'];
	compareReqRes.reqRes2.path = requestDetails2['details']['path'];
	
	if(compareReqRes.reqRes1.path != compareReqRes.reqRes2.path) {
		console.log("CRITICAL ERROR: assumed paths would be the same but they are not. We aren't comparing urls that just differ by domain.  Could be ordering maybe. " + 
					JSON.stringify(requestDetails1['details']) + ',' + JSON.stringify(requestDetails2['details'])
		);
	} else {
		console.log('NEW COMPARISON ' + requestDetails1['details']['path'] + ',' + requestDetails1['details']['domain'] + ',' + requestDetails2['details']['domain']);
		for (var key in responseHeaders1) {//not, currently missing iteration ove responseHeaders2
			if (responseHeaders1.hasOwnProperty(key) && responseHeaders2.hasOwnProperty(key)) {
				compareReqRes.processDifference(key,responseHeaders1[key],responseHeaders2[key]);
			} else if(responseHeaders1.hasOwnProperty(key)) {
				console.log('  DIFFERENCE In 1 but not 2 ' + key + ':' + responseHeaders1[key] );
			} else if(responseHeaders2.hasOwnProperty(key)) {
				console.log('  DIFFERENCE In 2 but not 1 ' + key + ':' + responseHeaders2[key] );
			} else {
				console.log("shouldn't be possible. Neither has a value for a value found.");
			}
	    }
	    if(compareReqRes.identical){
	    	console.log('  RESPONSES IDENTICAL');    	
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

