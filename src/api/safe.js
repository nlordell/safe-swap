import SafeAppsSDK from "@gnosis.pm/safe-apps-sdk";

const sdk = new SafeAppsSDK({
  allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/, /5afe.dev$/],
  debug: false,
});

export async function getInfo() {
  const { safeAddress, chainId } = await sdk.safe.getInfo();
  return { address: safeAddress, chainId };
}

export async function signTypedData(payload) {
  // HACK(nlordell): Not released yet...
  await sdk.communicator.send("rpcCall", {
    call: "safe_setSettings",
    params: [{ offChainSigning: true }],
  });

  const result = await sdk.txs.signTypedMessage(payload);
  return result;
}

const BASE_URL = "https://safe-client.staging.5afe.dev";

export async function messages() {
  // HACK(nlordell): Should go over the SDK...
  const { safeAddress, chainId } = await sdk.safe.getInfo();
  const url = `${BASE_URL}/v1/chains/${chainId}/safes/${safeAddress}/messages`;
  const response = await fetch(url);
  const { results } = await response.json();
  // TODO(nlordell): Deal with pagination...
  return results.filter(({ type }) => type === "MESSAGE");
}
