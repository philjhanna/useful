#!/bin/bash
echo "" >> tmp.txt
for (( c=1; c<=50; c++ ))
do
  curl -w "%{time_total}\n" -o /dev/null -s $1 >> tmp.txt
done

