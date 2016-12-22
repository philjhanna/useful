#!/bin/bash
filename='dependencies.txt'
echo "" > dependency-results.txt
echo "" >> dependency-results.txt
echo "RESULTS" >> dependency-results.txt
echo "" >> dependency-results.txt

while read p; do 
	test_result=$(sleep 1 | telnet $p | grep "Connected") 
	if [ $test_result == "" ]; 
	then
		echo $p "                    FAILED" >> dependency-results.txt 
	else 
		echo $p "                    SUCCESS " ${test_result} >> dependency-results.txt 
	fi
	
done < $filename

cat dependency-results.txt 