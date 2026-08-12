#!/bin/zsh
set -eu
script_dir="${0:A:h}"
skill_root="${script_dir:h}"
/usr/bin/osascript -l JavaScript "$script_dir/build-session.jxa" "${1:?session directory required}" "$skill_root"
