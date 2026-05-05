#!/bin/sh
mkdir output
find . -maxdepth 1 ! -name '.' ! -name 'output' -exec cp -R {} output/ \;
