import * as herald_partake from "./heraldPartake.js";

Hooks.on("ready", () => {
  setTimeout(() => {
    herald_partake.heraldPartake_renderButton();
    herald_partake.heraldPartake_renderListHistory();
    herald_partake.heraldPartake_universalInterfalUpdate();
  }, 1000);
});
