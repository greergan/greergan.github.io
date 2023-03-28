#!/bin/env bash

DENO=`which deno`

if [ $DENO ]; then
    $DENO run --allow-net --allow-read --allow-write --check -r /home/greergan/mnt/host/src/greergan.github.io/slim.generator/generate.ts -c http://192.168.122.59/configurations/website.json
else
    echo "deno executable not found"
fi