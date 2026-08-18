import { app } from "../../scripts/app.js";

const NODE_TYPE = "SettingsPresets";
const MAX_SETTINGS = 10;
const VALID_TYPES = ["INT", "FLOAT", "BOOLEAN", "STRING"];

const DEFAULT_CONFIG = {
    settings: [{ name: "value_1", type: "FLOAT" }],
    profiles: [
        { name: "Profile 1", values: [1.0] },
        { name: "Profile 2", values: [1.0] },
        { name: "Profile 3", values: [1.0] },
    ],
};

function parseConfig(str) {
    try {
        const parsed = JSON.parse(str);
        if (parsed && Array.isArray(parsed.settings) && Array.isArray(parsed.profiles)) {
            return parsed;
        }
    } catch (e) {
        /* fall through */
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function defaultValueForType(type) {
    switch (type) {
        case "INT":
            return 0;
        case "FLOAT":
            return 0.0;
        case "BOOLEAN":
            return false;
        default:
            return "";
    }
}

function coerceValue(value, type) {
    switch (type) {
        case "INT": {
            const n = parseInt(value, 10);
            return Number.isFinite(n) ? n : 0;
        }
        case "FLOAT": {
            const n = parseFloat(value);
            return Number.isFinite(n) ? n : 0.0;
        }
        case "BOOLEAN":
            return !!value;
        default:
            return value === undefined || value === null ? "" : String(value);
    }
}

function hideWidget(node, widget) {
    if (!widget) return;
    widget.type = "hidden";
    widget.computeSize = () => [0, -4];
    if (widget.linkedWidgets) {
        for (const w of widget.linkedWidgets) hideWidget(node, w);
    }
}

function findWidget(node, name) {
    return node.widgets ? node.widgets.find((w) => w.name === name) : null;
}

function syncOutputs(node, config) {
    const settings = config.settings.slice(0, MAX_SETTINGS);
    for (let i = 0; i < MAX_SETTINGS; i++) {
        const output = node.outputs[i];
        if (!output) continue;
        if (i < settings.length) {
            const s = settings[i];
            output.name = s.name || `value_${i + 1}`;
            output.type = s.type || "*";
        } else {
            output.name = `value_${i + 1}`;
            output.type = "*";
        }
    }
    node.setSize(node.computeSize());
    node.setDirtyCanvas(true, true);
}

function setActiveProfile(node, index, config) {
    const widget = findWidget(node, "active_profile");
    if (widget) widget.value = index;
    if (node.profileButtons) {
        node.profileButtons.forEach((btn, i) => {
            const profile = config.profiles[i] || {};
            btn.name = profile.name || `Profile ${i + 1}`;
            btn.color = i + 1 === index ? "#4a7" : undefined;
        });
    }
    node.setDirtyCanvas(true, true);
}

function openConfigDialog(node) {
    const configWidget = findWidget(node, "config");
    const config = parseConfig(configWidget ? configWidget.value : JSON.stringify(DEFAULT_CONFIG));

    while (config.profiles.length < 3) {
        config.profiles.push({ name: `Profile ${config.profiles.length + 1}`, values: [] });
    }
    config.profiles = config.profiles.slice(0, 3);

    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
        position: "fixed",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.6)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
    });

    const panel = document.createElement("div");
    Object.assign(panel.style, {
        background: "#222",
        color: "#ddd",
        padding: "16px",
        borderRadius: "8px",
        width: "640px",
        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    });

    const title = document.createElement("h3");
    title.textContent = "Configure Settings Presets";
    title.style.marginTop = "0";
    panel.appendChild(title);

    const countRow = document.createElement("div");
    countRow.style.marginBottom = "10px";
    const countLabel = document.createElement("label");
    countLabel.textContent = "Number of settings: ";
    const countInput = document.createElement("input");
    countInput.type = "number";
    countInput.min = "1";
    countInput.max = String(MAX_SETTINGS);
    countInput.value = String(config.settings.length || 1);
    countInput.style.width = "60px";
    countRow.appendChild(countLabel);
    countRow.appendChild(countInput);
    panel.appendChild(countRow);

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    panel.appendChild(table);

    function styleCell(cell) {
        cell.style.border = "1px solid #444";
        cell.style.padding = "4px";
    }

    function rebuildTable() {
        table.innerHTML = "";
        const count = Math.max(1, Math.min(MAX_SETTINGS, parseInt(countInput.value, 10) || 1));
        countInput.value = String(count);

        while (config.settings.length < count) {
            config.settings.push({ name: `value_${config.settings.length + 1}`, type: "FLOAT" });
        }
        config.settings = config.settings.slice(0, count);

        for (const profile of config.profiles) {
            while (profile.values.length < count) {
                profile.values.push(defaultValueForType(config.settings[profile.values.length].type));
            }
            profile.values = profile.values.slice(0, count);
        }

        const headRow = document.createElement("tr");
        const headers = ["Setting name", "Type", ...config.profiles.map((p) => "")];
        for (const h of headers) {
            const th = document.createElement("th");
            th.textContent = h;
            styleCell(th);
            headRow.appendChild(th);
        }
        table.appendChild(headRow);

        const profileNameRow = document.createElement("tr");
        const blankCell1 = document.createElement("td");
        const blankCell2 = document.createElement("td");
        styleCell(blankCell1);
        styleCell(blankCell2);
        blankCell1.textContent = "";
        blankCell2.textContent = "";
        profileNameRow.appendChild(blankCell1);
        profileNameRow.appendChild(blankCell2);
        config.profiles.forEach((profile, pIdx) => {
            const td = document.createElement("td");
            styleCell(td);
            const input = document.createElement("input");
            input.type = "text";
            input.value = profile.name;
            input.placeholder = `Profile ${pIdx + 1} name`;
            input.style.width = "100%";
            input.addEventListener("input", () => {
                profile.name = input.value;
            });
            td.appendChild(input);
            profileNameRow.appendChild(td);
        });
        table.appendChild(profileNameRow);

        for (let i = 0; i < count; i++) {
            const row = document.createElement("tr");

            const nameTd = document.createElement("td");
            styleCell(nameTd);
            const nameInput = document.createElement("input");
            nameInput.type = "text";
            nameInput.value = config.settings[i].name;
            nameInput.style.width = "100%";
            nameInput.addEventListener("input", () => {
                config.settings[i].name = nameInput.value;
            });
            nameTd.appendChild(nameInput);
            row.appendChild(nameTd);

            const typeTd = document.createElement("td");
            styleCell(typeTd);
            const typeSelect = document.createElement("select");
            for (const t of VALID_TYPES) {
                const opt = document.createElement("option");
                opt.value = t;
                opt.textContent = t;
                if (t === config.settings[i].type) opt.selected = true;
                typeSelect.appendChild(opt);
            }
            typeSelect.addEventListener("change", () => {
                config.settings[i].type = typeSelect.value;
                config.profiles.forEach((profile) => {
                    profile.values[i] = defaultValueForType(typeSelect.value);
                });
                rebuildTable();
            });
            typeTd.appendChild(typeSelect);
            row.appendChild(typeTd);

            config.profiles.forEach((profile) => {
                const valTd = document.createElement("td");
                styleCell(valTd);
                const type = config.settings[i].type;
                let valInput;
                if (type === "BOOLEAN") {
                    valInput = document.createElement("input");
                    valInput.type = "checkbox";
                    valInput.checked = !!profile.values[i];
                    valInput.addEventListener("change", () => {
                        profile.values[i] = valInput.checked;
                    });
                } else {
                    valInput = document.createElement("input");
                    valInput.type = type === "STRING" ? "text" : "number";
                    if (type === "FLOAT") valInput.step = "any";
                    valInput.value = profile.values[i];
                    valInput.style.width = "100%";
                    valInput.addEventListener("input", () => {
                        profile.values[i] = coerceValue(valInput.value, type);
                    });
                }
                valTd.appendChild(valInput);
                row.appendChild(valTd);
            });

            table.appendChild(row);
        }
    }

    countInput.addEventListener("change", rebuildTable);
    rebuildTable();

    const btnRow = document.createElement("div");
    btnRow.style.marginTop = "12px";
    btnRow.style.textAlign = "right";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.marginRight = "8px";
    cancelBtn.addEventListener("click", () => document.body.removeChild(overlay));

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => {
        if (configWidget) {
            configWidget.value = JSON.stringify(config);
        }
        syncOutputs(node, config);
        setActiveProfile(node, findWidget(node, "active_profile")?.value || 1, config);
        document.body.removeChild(overlay);
    });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    panel.appendChild(btnRow);

    overlay.appendChild(panel);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) document.body.removeChild(overlay);
    });
    document.body.appendChild(overlay);
}

app.registerExtension({
    name: "comfyui.settings.presets",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

            const configWidget = findWidget(this, "config");
            const activeWidget = findWidget(this, "active_profile");
            hideWidget(this, configWidget);
            hideWidget(this, activeWidget);

            const config = parseConfig(configWidget ? configWidget.value : JSON.stringify(DEFAULT_CONFIG));

            this.profileButtons = [];
            for (let i = 0; i < 3; i++) {
                const idx = i + 1;
                const btn = this.addWidget(
                    "button",
                    (config.profiles[i] && config.profiles[i].name) || `Profile ${idx}`,
                    null,
                    () => setActiveProfile(this, idx, parseConfig(findWidget(this, "config").value)),
                );
                btn.serialize = false;
                this.profileButtons.push(btn);
            }

            this.addWidget("button", "Configure Profiles...", null, () => openConfigDialog(this));

            setActiveProfile(this, activeWidget ? activeWidget.value : 1, config);
            syncOutputs(this, config);

            return r;
        };

        const onConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function () {
            const r = onConfigure ? onConfigure.apply(this, arguments) : undefined;
            const configWidget = findWidget(this, "config");
            const config = parseConfig(configWidget ? configWidget.value : JSON.stringify(DEFAULT_CONFIG));
            syncOutputs(this, config);
            setActiveProfile(this, findWidget(this, "active_profile")?.value || 1, config);
            return r;
        };
    },
});
