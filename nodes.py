import json

MAX_SETTINGS = 10
VALID_TYPES = ("INT", "FLOAT", "BOOLEAN", "STRING")

DEFAULT_CONFIG = {
    "settings": [
        {"name": "value_1", "type": "FLOAT"},
    ],
    "profiles": [
        {"name": "Profile 1", "values": [1.0]},
        {"name": "Profile 2", "values": [1.0]},
        {"name": "Profile 3", "values": [1.0]},
    ],
}


def _cast(value, type_name):
    try:
        if type_name == "INT":
            return int(value)
        if type_name == "FLOAT":
            return float(value)
        if type_name == "BOOLEAN":
            return bool(value)
        return "" if value is None else str(value)
    except (TypeError, ValueError):
        if type_name == "INT":
            return 0
        if type_name == "FLOAT":
            return 0.0
        if type_name == "BOOLEAN":
            return False
        return ""


class SettingsPresets:
    """
    Stores up to three configurable profiles of named/typed settings and
    outputs the values of whichever profile is currently active.

    Profile selection normally comes from the node's three on-node buttons
    (stored in the hidden `active_profile` widget). If `profile_select` is
    connected or set to a nonzero value, it overrides the buttons.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "profile_select": ("INT", {"default": 0, "min": 0, "max": 3, "step": 1}),
                "config": ("STRING", {"default": json.dumps(DEFAULT_CONFIG), "multiline": True}),
                "active_profile": ("INT", {"default": 1, "min": 1, "max": 3}),
            },
        }

    RETURN_TYPES = tuple("*" for _ in range(MAX_SETTINGS))
    RETURN_NAMES = tuple(f"value_{i + 1}" for i in range(MAX_SETTINGS))
    FUNCTION = "run"
    CATEGORY = "utils/presets"

    def run(self, profile_select, config, active_profile):
        try:
            parsed = json.loads(config) if config else DEFAULT_CONFIG
        except (TypeError, ValueError, json.JSONDecodeError):
            parsed = DEFAULT_CONFIG

        settings = parsed.get("settings", [])
        profiles = parsed.get("profiles", [])

        chosen_index = profile_select if profile_select in (1, 2, 3) else active_profile
        chosen_index = max(1, min(3, chosen_index))

        profile = profiles[chosen_index - 1] if chosen_index - 1 < len(profiles) else {}
        values = profile.get("values", [])

        outputs = []
        for i in range(MAX_SETTINGS):
            if i < len(settings):
                setting_type = settings[i].get("type", "FLOAT")
                raw_value = values[i] if i < len(values) else None
                outputs.append(_cast(raw_value, setting_type))
            else:
                outputs.append(None)

        return tuple(outputs)


NODE_CLASS_MAPPINGS = {
    "SettingsPresets": SettingsPresets,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "SettingsPresets": "Settings Presets",
}
