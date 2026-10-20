// Signs release builds with the keystore given through environment variables (set in CI).
// Without them, the default Expo setup (debug keystore) is kept.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// mshare-release-signing';

const SNIPPET = `
${MARKER}
android {
    signingConfigs {
        mshotsRelease {
            def ks = System.getenv("MSHOTS_KEYSTORE")
            if (ks) {
                storeFile file(ks)
                storePassword System.getenv("MSHOTS_KEYSTORE_PASSWORD")
                keyAlias System.getenv("MSHOTS_KEY_ALIAS")
                keyPassword System.getenv("MSHOTS_KEY_PASSWORD")
                enableV1Signing true
                enableV2Signing true
                enableV3Signing true
            }
        }
    }
    buildTypes {
        release {
            if (System.getenv("MSHOTS_KEYSTORE")) {
                signingConfig signingConfigs.mshotsRelease
            }
        }
    }
}
`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents += SNIPPET;
    }
    return cfg;
  });
};
