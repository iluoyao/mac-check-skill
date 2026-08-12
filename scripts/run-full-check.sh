#!/bin/zsh
set -eu

script_dir="${0:A:h}"
output_root="./mac-check-output"
locale="zh-CN"
open_page=true

while (( $# )); do
  case "$1" in
    --output-root) output_root="${2:?value required}"; shift 2;;
    --locale) locale="${2:?value required}"; shift 2;;
    --no-open) open_page=false; shift;;
    -h|--help) print "usage: run-full-check.sh [--output-root DIR] [--locale zh-CN|en-US] [--no-open]"; exit 0;;
    *) print -u2 "unknown option: $1"; exit 64;;
  esac
done

if [[ "$locale" != "zh-CN" && "$locale" != "en-US" ]]; then
  print -u2 "unsupported locale: $locale"
  exit 64
fi

if [[ "$locale" == "zh-CN" ]]; then
  print -u2 "正在检测，请勿关闭窗口"
else
  print -u2 "Checking your Mac. Please do not close this window."
fi

session_dir="$(/bin/zsh "$script_dir/prepare-session.sh" "$output_root" "$locale")"
/bin/zsh "$script_dir/runtime-check.sh" "$session_dir/runtime.json"
/bin/zsh "$script_dir/collect-system.sh" "$session_dir"
/bin/zsh "$script_dir/normalize.sh" "$session_dir" >/dev/null
/bin/zsh "$script_dir/evaluate-system.sh" "$session_dir" >/dev/null
session_html="$(/bin/zsh "$script_dir/build-session.sh" "$session_dir")"

print "SESSION_DIR=$session_dir"
print "SESSION_HTML=$session_html"
if [[ "$locale" == "zh-CN" ]]; then
  print -u2 "系统检测完成，请使用浏览器访问 $session_html 完成后续检测和下载报告"
else
  print -u2 "System checks complete. Open $session_html in a browser to finish the remaining checks and download the report."
fi
if [[ "$open_page" == true ]]; then
  if /bin/zsh "$script_dir/open-session.sh" "$session_html"; then
    print "PAGE_OPENED=true"
  else
    print -u2 "页面未能自动打开，请手动打开 SESSION_HTML 指向的文件。"
    print "PAGE_OPENED=false"
  fi
fi
