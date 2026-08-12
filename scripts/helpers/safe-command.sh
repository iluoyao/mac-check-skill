#!/bin/zsh
set -u
unsetopt BG_NICE

if (( $# < 4 )); then
  print -u2 "usage: safe-command.sh <probe-id> <timeout-seconds> <output-dir> <command> [args...]"
  exit 64
fi

probe_id="$1"
timeout_seconds="$2"
output_dir="$3"
shift 3

/bin/mkdir -p "$output_dir"
stdout_file="$output_dir/${probe_id}.out"
stderr_file="$output_dir/${probe_id}.err"
meta_file="$output_dir/${probe_id}.meta.json"

if [[ ! -x "$1" ]]; then
  /usr/bin/printf '{"id":"%s","available":false,"status":"SKIPPED","reason":"command unavailable","exitCode":null}\n' "$probe_id" > "$meta_file"
  : > "$stdout_file"
  : > "$stderr_file"
  exit 0
fi

"$@" > "$stdout_file" 2> "$stderr_file" &
command_pid=$!
started=$SECONDS
timed_out=false
while /bin/kill -0 "$command_pid" 2>/dev/null; do
  if (( SECONDS - started >= timeout_seconds )); then
    timed_out=true
    /bin/kill -TERM "$command_pid" 2>/dev/null || true
    /bin/sleep 1
    /bin/kill -KILL "$command_pid" 2>/dev/null || true
    break
  fi
  /bin/sleep 0.1
done

wait "$command_pid" 2>/dev/null
exit_code=$?
if [[ "$timed_out" == true ]]; then
  probe_status="TIMEOUT"
  reason="probe exceeded ${timeout_seconds}s"
elif (( exit_code != 0 )); then
  probe_status="ERROR"
  reason="command exited non-zero"
elif [[ ! -s "$stdout_file" ]]; then
  probe_status="EMPTY"
  reason="command returned no output"
else
  probe_status="OK"
  reason=""
fi

/usr/bin/printf '{"id":"%s","available":true,"status":"%s","reason":"%s","exitCode":%d}\n' \
  "$probe_id" "$probe_status" "$reason" "$exit_code" > "$meta_file"
exit 0
