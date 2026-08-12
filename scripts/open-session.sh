#!/bin/zsh
set -eu
session_html="${1:?session HTML required}"
[[ -f "$session_html" ]]
/usr/bin/open "$session_html"
