# MacCheck Skill

[简体中文](README.md) | [English](README.en.md)

An Agent Skill for checking a Mac. It automatically inspects system and device information, opens a local page for guided hardware checks, and generates a downloadable inspection report.

## What It Checks

- Mac model, system, battery, storage, security status, network, and peripherals.
- Keyboard, display, audio, microphone, camera, Touch ID, trackpad, and ports.
- Hardware capabilities matched to different Mac models, with safe fallback behavior for unknown new models.
- Downloadable reports in Markdown, PDF, or PNG.
- Simplified Chinese and English interfaces.

## How to Use

Download or clone this repo, or download and extract `mac-check-skill.zip` from Releases, then choose either method below.

### Use with an Agent

1. In your Agent desktop (e.g., WorkBuddy, Claude, Codex, Cursor), install or import this repo as a Skill.
2. Ask the AI:

   > Check this Mac for me.

The AI creates an inspection Session, runs the system checks, and opens the hardware-check page. Follow the on-screen guidance, then download the completed report directly from the page.

### Use from Terminal

To run MacCheck without an Agent, open Terminal, enter the extracted project root, and run:

```bash
cd /path/to/mac-check-skill
/bin/zsh ./scripts/run-full-check.sh --output-root ./mac-check-output --locale en-US
```

Replace `/path/to/mac-check-skill` with the actual project path. When the system checks finish, the local hardware-check page opens automatically. If it does not open, find the `SESSION_HTML` path in Terminal and open it manually. Inspection data is saved in `mac-check-output` at the project root.

## Privacy

- Runs locally and offline by default. Inspection data is not uploaded automatically.
- System checks are read-only and do not modify system settings.
- Results and reports stay on the Mac. Review device details such as the serial number before sharing a report publicly.

## Notes

Due to browser and macOS permission limits, checks such as Touch ID, display defects, audio quality, trackpad feel, and the physical condition of ports still require user confirmation. Results are for reference and do not replace an official Apple diagnostic.

## Acknowledgements

Some product ideas and design inspiration for this project came from [MacCheck](https://github.com/andyhuo520/MacCheck). Many thanks to its author and contributors for their excellent work.
