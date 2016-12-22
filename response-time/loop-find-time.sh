#!/bin/bash
# ./loop-find-time.sh www.google.com
# will create a tmp.txt with
# 0.156
# 0.151
# 0.099
# 0.105
# 0.114
# 0.102
# 0.101
# 0.096
# 0.095
# etc...
#
echo "" >> tmp.txt
for (( c=1; c<=50; c++ ))
do
  curl -w "%{time_total}\n" -o /dev/null -s $1 >> tmp.txt
done

