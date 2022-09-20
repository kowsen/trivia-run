#!/bin/bash

for d in */; do
    cd $d
    npm install --omit optional
    npm run build:clean
    npm run build
    rm -rf node_modules && npm i --production --ignore-scripts
    cd ..
done