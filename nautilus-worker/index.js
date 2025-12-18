const express = require('express');
const axios = require('axios');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction } = require('@mysten/sui/transactions');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
const SUI_RPC_URL = getFullnodeUrl('testnet');
const PACKAGE_ID = process.env.PACKAGE_ID || "0x...";
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY; // The "TEE" Key

const client = new SuiClient({ url: SUI_RPC_URL });

/**
 * Nautilus TEE Simulation
 * 1. Receives a Blob ID
 * 2. Fetches content from Walrus
 * 3. Performs OCR Verification (Simulated as content check)
 * 4. Generates "Verified" Audio via TTS (Simplified as signing the blob)
 * 5. Signs and submits a transaction to Sui to mark as 'Verified'
 */
app.post('/verify', async (req, res) => {
    const { blobId, handoutId } = req.body;

    if (!blobId || !handoutId) {
        return res.status(400).json({ error: "Missing blobId or handoutId" });
    }

    console.log(`[TEE] Starting verification for handout: ${handoutId}, blob: ${blobId}`);

    try {
        // Step 1: Fetch from Walrus
        const walrusUrl = `${WALRUS_AGGREGATOR}/v1/${blobId}`;
        const response = await axios.get(walrusUrl);
        const textContent = response.data;

        console.log(`[TEE] Content fetched from Walrus (${textContent.length} chars)`);

        // Step 2: Verification Logic (Simulated)
        // In reality, this would run OCR on a stored image and compare with textContent
        const isAccurate = textContent.length > 5; // Simplified check

        if (!isAccurate) {
            return res.status(422).json({ error: "Verification failed: content too short or corrupted" });
        }

        // Step 3: Sign On-chain Attestation
        if (!ADMIN_SECRET_KEY) {
            console.log("[TEE] Admin key missing, skipping on-chain update (Demo Mode)");
            return res.json({
                status: "verified_locally",
                message: "Verification successful, but TEE key not configured for on-chain signing."
            });
        }

        const keypair = Ed25519Keypair.fromSecretKey(ADMIN_SECRET_KEY);
        const tx = new Transaction();

        tx.moveCall({
            target: `${PACKAGE_ID}::echo::verify_handout`,
            arguments: [
                tx.object(handoutId)
            ],
        });

        const result = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
        });

        console.log(`[TEE] Verification tx submitted: ${result.digest}`);

        res.json({
            status: "verified_onchain",
            digest: result.digest,
            attestation: "SUI_ECHO_TEE_SIGNED_VERIFICATION_V1"
        });

    } catch (err) {
        console.error("[TEE] Processing Error:", err.message);
        res.status(500).json({ error: "TEE processing failed" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Nautilus TEE Simulator running on port ${PORT}`);
});
