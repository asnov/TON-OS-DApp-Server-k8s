#!/bin/bash

for chart in {"arangodb","kafka","q-server","statsd","ton-node"}; do 
  helm upgrade -n $1 $chart ./$chart
  echo "=================================="
done
