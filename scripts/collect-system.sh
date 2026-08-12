#!/bin/zsh
set -eu

session_dir="${1:?session directory required}"
script_dir="${0:A:h}"
raw_dir="$session_dir/raw"
/bin/mkdir -p "$raw_dir"

probe() {
  /bin/zsh "$script_dir/helpers/safe-command.sh" "$@"
}

probe hardware 20 "$raw_dir" /usr/sbin/system_profiler SPHardwareDataType -json -detailLevel full
probe software 10 "$raw_dir" /usr/sbin/system_profiler SPSoftwareDataType -json -detailLevel mini
probe power 20 "$raw_dir" /usr/sbin/system_profiler SPPowerDataType -json -detailLevel mini
probe storage 20 "$raw_dir" /usr/sbin/system_profiler SPStorageDataType -json -detailLevel full
probe nvme 20 "$raw_dir" /usr/sbin/system_profiler SPNVMeDataType -json -detailLevel full
probe wifi 20 "$raw_dir" /usr/sbin/system_profiler SPAirPortDataType -json -detailLevel mini
probe wifi-power 8 "$raw_dir" /bin/zsh "$script_dir/helpers/wifi-power.sh"
probe bluetooth 20 "$raw_dir" /usr/sbin/system_profiler SPBluetoothDataType -json -detailLevel mini
probe usb 20 "$raw_dir" /usr/sbin/system_profiler SPUSBDataType -json -detailLevel mini
probe thunderbolt 20 "$raw_dir" /usr/sbin/system_profiler SPThunderboltDataType -json -detailLevel mini
probe displays 20 "$raw_dir" /usr/sbin/system_profiler SPDisplaysDataType -json -detailLevel mini
probe audio 20 "$raw_dir" /usr/sbin/system_profiler SPAudioDataType -json -detailLevel mini
probe camera 20 "$raw_dir" /usr/sbin/system_profiler SPCameraDataType -json -detailLevel mini
probe platform 10 "$raw_dir" /usr/sbin/ioreg -rd1 -c IOPlatformExpertDevice
probe battery 10 "$raw_dir" /usr/sbin/ioreg -r -c AppleSmartBattery
probe diskutil 15 "$raw_dir" /usr/sbin/diskutil info -plist /
probe df 5 "$raw_dir" /bin/df -kP /
probe profiles 15 "$raw_dir" /usr/bin/profiles status -type enrollment
probe filevault 10 "$raw_dir" /usr/bin/fdesetup status
probe sip 10 "$raw_dir" /usr/bin/csrutil status
probe sw-vers 5 "$raw_dir" /usr/bin/sw_vers
probe architecture 5 "$raw_dir" /usr/bin/uname -m

exit 0
