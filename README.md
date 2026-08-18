# ComfyUI-Node-Settings-Presets

A ComfyUI custom node that stores up to three configurable "profiles" of
named/typed settings and outputs the values of whichever profile is active.

## Node: Settings Presets

**Inputs**
- `profile_select` (INT): `0` lets the on-node buttons choose the active
  profile. `1`, `2`, or `3` forces that profile regardless of the buttons
  (useful when driven from another node).

**On-node controls**
- Three exclusive buttons (one per profile) that set the active profile
  when `profile_select` is `0`.
- A **Configure Profiles...** button that opens a popup to set:
  - the number of settings (up to 10)
  - each setting's name and type (`INT`, `FLOAT`, `BOOLEAN`, `STRING`) —
    types are shared across all three profiles
  - each profile's name and per-setting values

**Outputs**
- Up to 10 outputs, one per configured setting, named and typed to match
  the setting's configuration. They carry the values of the currently
  active profile. Unused output slots beyond the configured setting count
  are left untyped.

## Installation

Clone this repository into your ComfyUI `custom_nodes` directory and
restart ComfyUI:

```
cd ComfyUI/custom_nodes
git clone https://github.com/StylusEcho/ComfyUI-Node-Settings-Presets
```
