#!/bin/zsh
set -eu

output_file="${1:?output path required}"
output_dir="${output_file:h}"
/bin/mkdir -p "$output_dir"

osascript_ok=false
open_ok=false
system_profiler_ok=false
[[ -x /usr/bin/osascript ]] && osascript_ok=true
[[ -x /usr/bin/open ]] && open_ok=true
[[ -x /usr/sbin/system_profiler ]] && system_profiler_ok=true

/usr/bin/printf '{\n  "schemaVersion":"2.0",\n  "checkedAt":"%s",\n  "platform":"%s",\n  "tools":{"osascript":%s,"open":%s,"systemProfiler":%s},\n  "constraints":{"noNetwork":true,"noPrivilegeEscalation":true,"selfContainedSession":true}\n}\n' \
  "$(/bin/date -u +%Y-%m-%dT%H:%M:%SZ)" "$(/usr/bin/uname -s)" "$osascript_ok" "$open_ok" "$system_profiler_ok" > "$output_file"

[[ "$(/usr/bin/uname -s)" == "Darwin" && "$osascript_ok" == true && "$system_profiler_ok" == true ]]
