# Contributor instructions

Before coding, state the model and effort and wait for the owner to confirm. Then give five short lines covering role, why, risk, files, and test plan. Report actual results and the deployment and commit state afterward. Use a frontend engineering and product design role for interface work, QA first for regressions, and DevOps for deployment. Seek explicit approval for production changes. For non-code tasks use deliverable and success criteria.

Use feature branches. Stage named files and commit or push only when requested. Avoid publishing real maps, layouts, entity identifiers, credentials or captured household telemetry. Demo assets and tests must use fictional data.

This card is a browser ES module. The scene uses Three.js and the build uses esbuild. Run npm ci, npm run build and npm test. Keep the built dist file in sync with its source for HACS installs. Test commands against the mock service recorder.
