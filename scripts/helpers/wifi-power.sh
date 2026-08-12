#!/bin/zsh
set -eu

networksetup=/usr/sbin/networksetup
[[ -x "$networksetup" ]]

ports="$($networksetup -listallhardwareports 2>/dev/null || true)"
device="$(/usr/bin/printf '%s\n' "$ports" | /usr/bin/awk '
  /^Hardware Port: (Wi-Fi|AirPort)$/ { wifi=1; next }
  wifi && /^Device: / { print $2; exit }
  /^$/ { wifi=0 }
')"
if [[ -n "$device" ]]; then
  "$networksetup" -getairportpower "$device"
  exit $?
fi

for device in en0 en1; do
  result="$($networksetup -getairportpower "$device" 2>/dev/null || true)"
  if [[ "$result" == *": On" || "$result" == *": Off" ]]; then
    /usr/bin/printf '%s\n' "$result"
    exit 0
  fi
done
exit 1
