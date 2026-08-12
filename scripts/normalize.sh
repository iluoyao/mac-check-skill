#!/bin/zsh
set -eu
script_dir="${0:A:h}"
/usr/bin/osascript -l JavaScript "$script_dir/normalize.jxa" "$@"
