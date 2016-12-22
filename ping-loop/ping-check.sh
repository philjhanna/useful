#!/bin/bash
filename='domains.txt'
echo "" > domains-results.txt
echo "" >> domains-results.txt
echo "RESULTS" >> domains-results.txt
echo "" >> domains-results.txt

while read p; do 
	if [ "$p" == "IGNORE" ]; then
		echo $p "SPACING..." >> domains-results.txt 
	else
		test_result=$(sleep 1 | ping -c 1 -t 1 $p | grep "PING" | cut -d" " -f2,3)
		if [ "$test_result" == "" ]; then
			echo $p FAILED >> domains-results.txt
		else 
			echo $p ${test_result} >> domains-results.txt 
		fi
	fi

	
done < $filename

cat domains-results.txt 