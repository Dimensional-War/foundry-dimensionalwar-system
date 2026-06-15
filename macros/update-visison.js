const controlled = canvas.tokens.controlled;
if (!controlled.length) {
  ui.notifications.warn("No tokens selected.");
  return;
}

const tabs = controlled
  .map((t, i) => {
    const sight = t.document.sight;
    const light = t.document.light;
    return `
    <div class="tab-panel" data-tab="token-${i}" style="display:${i === 0 ? "block" : "none"}">
      <fieldset style="margin-bottom:8px">
        <legend>Vision</legend>
        <label>Range
          <input type="number" name="sightRange_${i}" value="${sight.range ?? 0}" style="width:100%">
        </label>
      </fieldset>
      <fieldset>
        <legend>Light</legend>
        <label>Dim Radius
          <input type="number" name="lightDim_${i}" value="${light.dim ?? 0}" style="width:100%">
        </label>
        <label>Bright Radius
          <input type="number" name="lightBright_${i}" value="${light.bright ?? 0}" style="width:100%">
        </label>
        <label>Angle
          <input type="number" name="lightAngle_${i}" value="${light.angle ?? 360}" min="0" max="360" style="width:100%">
        </label>
      </fieldset>
    </div>
  `;
  })
  .join("");

const tabNav = controlled
  .map(
    (t, i) => `
  <button type="button" class="dw-tab-btn${i === 0 ? " active" : ""}" data-tab="token-${i}"
    style="margin-right:4px; font-weight:${i === 0 ? "bold" : "normal"}">
    ${t.name}
  </button>
`
  )
  .join("");

const result = await foundry.applications.api.DialogV2.prompt({
  window: { title: "Update Vision & Light" },
  content: `
    <div style="margin-bottom:8px; display:flex; align-items:center; gap:12px">
      ${tabNav}
      <label style="margin-left:auto; display:flex; align-items:center; gap:4px; white-space:nowrap">
        <input type="checkbox" name="applyAll"> Apply first tab to all
      </label>
    </div>
    <div id="dw-tab-content">
      ${tabs}
    </div>
  `,
  render: (_event, dialog) => {
    const html = dialog instanceof HTMLElement ? dialog : dialog.element;
    const btns = html.querySelectorAll(".dw-tab-btn");
    const panels = html.querySelectorAll(".tab-panel");

    btns.forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;

        btns.forEach(b => {
          b.classList.remove("active");
          b.style.fontWeight = "normal";
        });
        btn.classList.add("active");
        btn.style.fontWeight = "bold";

        panels.forEach(p => {
          p.style.display = p.dataset.tab === target ? "block" : "none";
        });
      });
    });
  },
  ok: {
    label: "Submit",
    callback: (_event, button) => {
      const els = button.form.elements;
      const applyAll = els.applyAll.checked;

      const first = {
        sightRange: parseInt(els.sightRange_0.value, 10),
        lightBright: parseInt(els.lightBright_0.value, 10),
        lightDim: parseInt(els.lightDim_0.value, 10),
        lightAngle: parseInt(els.lightAngle_0.value, 10)
      };

      return controlled.map((_, i) => {
        if (applyAll) return { ...first };
        return {
          sightRange: parseInt(els[`sightRange_${i}`].value, 10),
          lightBright: parseInt(els[`lightBright_${i}`].value, 10),
          lightDim: parseInt(els[`lightDim_${i}`].value, 10),
          lightAngle: parseInt(els[`lightAngle_${i}`].value, 10)
        };
      });
    }
  }
});

if (!result) return;

for (let i = 0; i < controlled.length; i++) {
  const token = controlled[i];
  const data = result[i];
  await token.document.update({
    "sight.enabled": true,
    "sight.range": data.sightRange,
    "light.bright": data.lightBright,
    "light.dim": data.lightDim,
    "light.angle": data.lightAngle
  });
  ui.notifications.info(`✔ ${token.name}'s vision & light updated!`);
}
