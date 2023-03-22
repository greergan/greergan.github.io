#!/bin/env bash

DENO=`which deno`

if [ $DENO ]; then
    $DENO run --allow-net --allow-read --allow-write --check -r /home/greergan/mnt/host/src/greergan.github.io/slim.generator/generate.ts -c models/website.json -id 0
else
    echo "deno executable not found"
fi