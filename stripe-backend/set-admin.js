const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = require(
  "/data/data/com.termux/files/home/storage/downloads/juniorgame-production-780b489b92c8.json"
);

initializeApp({
  credential: cert(serviceAccount),
});

const email = "josefranciisco17@gmail.com";

async function convertirEnAdmin() {
  try {
    const user = await getAuth().getUserByEmail(email);

    await getAuth().setCustomUserClaims(user.uid, {
      admin: true,
    });

    console.log("✅ Usuario convertido en administrador.");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exitCode = 1;
  }
}

convertirEnAdmin();
