## Environment

This machine is an EndeavourOS / Arch Linux system.

System details:

- OS: EndeavourOS x86_64
- Kernel: Linux 7.0.3-arch1-2
- Package manager: pacman
- Shell: fish 4.7.0
- Node.js: v24.15.0
- npm: 11.12.1
- Node path: `~/.local/share/nvm/v24.15.0/bin/node`
- Window manager: niri 26.04 on Wayland
- Terminal multiplexer: zellij 0.44.2
- Display: 1920x1200 @ 60Hz
- Filesystem: ext4
- Machine: Lenovo ThinkPad X1 Carbon Gen 9
- CPU: Intel Core i7-1185G7
- GPU: Intel Iris Xe Graphics
- RAM: 16GB

## Important System Assumptions

The active desktop/session stack is:

```txt
Wayland
└── niri
    └── DMS / shell tooling when applicable
```

## Agent skills

### Issue tracker

Issues tracked as local markdown under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use canonical defaults: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: root `CONTEXT.md` + `docs/adr/` (when present). See `docs/agents/domain.md`.
