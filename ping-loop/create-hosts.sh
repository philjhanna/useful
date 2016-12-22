#!/bin/bash
#
# if domains looks like this
#
# www.bbc.com
# www.google.com
#
# the output is
# #Hosts entries
#
# 151.101.192.81 www.bbc.com
# 216.58.192.164 www.google.com
#
#
filename='domains.txt'
echo "" > new-hosts.txt
echo "" >> new-hosts.txt
echo "#Hosts entries" >> new-hosts.txt
echo "" >> new-hosts.txt

while read p; do 
	if [ "$p" == "IGNORE" ]; then
		echo "#SPACE" >> new-hosts.txt 
	else
		test_result=$(sleep 1 | ping -c 1 -t 1 $p | grep "PING" | cut -d" " -f3 | cut -d"(" -f2 | cut -d")" -f1)
		if [ "$test_result" == "" ]; then
			echo "# FAILED" $p >> new-hosts.txt
		else 
			echo ${test_result} $p >> new-hosts.txt 
		fi
	fi
done < $filename

cat new-hosts.txt 