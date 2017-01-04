//This is in development right now (Jan 2017)
//THe purpose if to find the difference a caching change will have.
//Due to the nature of the change I'm expecting that if there are difference (there shouldn't be)
//then they would show up as http header cache differences which is why this is focusing on these.
//I will change this to be more generic after. 
var diff = require('diff'),
	fs = require('fs'),
	directory = './output/',
	firstResponseHeader = null; //this last one is ugle. nasty pattern.
	outputResultsFile = 'outputtmp.html';

var outputStreamOptions = {encoding: 'utf8'};
var outputStream;

function outputResult(message){
	console.log(message);
	if(outputStream != null){
		outputStream.write(message + '\r');		
	}
}
function outputResultDifference(compareReqRes,key, value1, value2, note){
	text = '<tr>' 
		+ '<td>' + compareReqRes.reqRes1.path + '</td>'
		+ '<td>' + compareReqRes.reqRes1.domain + '</td>'
		+ '<td>' + compareReqRes.reqRes2.domain + '</td>'
		+ '<td>' + key + '</td>'
		+ '<td>' + value1 + '</td>'
		+ '<td>' + value2 + '</td>'
		+ '<td>' + note + '</td>'
		+ '</tr>';
	outputResult(text);
}

function outputResultMessage(compareReqRes,message){
	text = '<tr>' 
		+ '<td>' + compareReqRes.reqRes1.path + '</td>'
		+ '<td>' + compareReqRes.reqRes1.domain + '</td>'
		+ '<td>' + compareReqRes.reqRes2.domain + '</td>'
		+ '<td colspan="4">' + message + '</td>'
		+ '</tr>';
	outputResult(text);
}

var buildHTMLFileStart = `
	<html>
		<head>
			<title>Compare URLS</title>
		</head>
		<body>
			<table border=1>
	`;


var buildHTMLFileEnd = `
			</table>
		</body>
	</html>
	`;

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
			this.processDifferenceRequired(key, value1, value2, 'max-age present for one but not other');
		} else {
			maxAgeValue1 = parseInt(value1.substring(maxAgePos1 + 8));
			maxAgeValue2 = parseInt(value2.substring(maxAgePos1 + 8));
			if(maxAgeValue1 == maxAgePos2){
				this.processDifferenceRequired(key, value1, value2, 'Unsure, found max-age but after extracting they seem the same. extracting failure.');
			} else if(maxAgeValue1 == 0 || maxAgeValue2 == 0){
				this.processDifferenceRequired(key, value1, value2, 'max-age value: ' + maxAgeValue1 + ',' + maxAgeValue2);
			} else {
				maxAgeDiffFactor = maxAgeValue1 > maxAgeValue2 ? maxAgeValue1/maxAgeValue2 : maxAgeValue2/maxAgeValue1;
				if(maxAgeDiffFactor > this.maxAgeAllowedDiffFactor){
					this.processDifferenceRequired(key, value1, value2, 'max-age value: ' + maxAgeValue1 + ', ' + maxAgeValue2 + ' difference factor = '
					 + maxAgeDiffFactor + ' greater that acceptable amount of ' + this.maxAgeAllowedDiffFactor);
				} else {
					//this is NOT a good test.  But I'm going to assume that if the max-ages are similar then we can ignore the difference.
					//max-age's could be dissimilar for valid reasons or similar accidentally. 
					//But I need to filter down the results and look for obvious issues.
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
		this.processDifferenceRequired(key, value1, value2, '');
	}
	this.processDifferenceRequired = function (key, value1, value2, note) {
		outputResultDifference(this, key, value1, value2, note);
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
		outputResultMessage(compareReqRes,"CRITICAL ERROR: assumed paths would be the same but they are not. We aren't comparing urls that just "
					+ "differ by domain.  Could be ordering maybe. "
					+ JSON.stringify(requestDetails1['details']) + ',' + JSON.stringify(requestDetails2['details'])
		);
	} else {
		for (var key in responseHeaders1) {//not, currently missing iteration ove responseHeaders2
			if (responseHeaders1.hasOwnProperty(key) && responseHeaders2.hasOwnProperty(key)) {
				compareReqRes.processDifference(key,responseHeaders1[key],responseHeaders2[key]);
			} else if(responseHeaders1.hasOwnProperty(key)) {
				outputResultMessage(compareReqRes,'  DIFFERENCE In 1 but not 2 ' + key + ':' + responseHeaders1[key] );
			} else if(responseHeaders2.hasOwnProperty(key)) {
				outputResultMessage(compareReqRes,'  DIFFERENCE In 2 but not 1 ' + key + ':' + responseHeaders2[key] );
			} else {
				outputResultMessage(compareReqRes,"shouldn't be possible. Neither has a value for a value found.");
			}
	    }
	    if(compareReqRes.identical){
	    	outputResultMessage(compareReqRes,'RESPONSES IDENTICAL');    	
	    }
	}
}; 

fs.readdir(directory, (err, files) => {
	outputStream = fs.createWriteStream(outputResultsFile,outputStreamOptions);
	outputStream.on('finish',function (){
		console.log('file has been written');
	});
	outputResult(buildHTMLFileStart);

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

	outputResult(buildHTMLFileEnd);
	outputStream.end();
	//lets see what was written to the file
	//fs.readFile(outputResultsFile,'utf8',function(err,contents){
	//	console.log(contents);
	//});

});

