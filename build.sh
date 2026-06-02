#!/bin/sh
mkdir output
find . -maxdepth 1 ! -name '.' ! -name 'output' ! -name '.git' -exec cp -R {} output/ \;
