import SafeAppsSDK from "@safe-global/safe-apps-sdk";

const sdk = new SafeAppsSDK({
  allowedDomains: [/gnosis-safe.io$/, /safe.global$/, /5afe.dev$/],
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

export async function messages() {
  // HACK(nlordell): Should go over the SDK...
  const { safeAddress, chainId } = await sdk.safe.getInfo();
  const { chainName } = await sdk.safe.getChainInfo();
  const url = `https://safe-transaction-${chainName}.safe.global/api/v1/safes/${safeAddress}/messages`;
  const response = await fetch(url);
  const { results } = await response.json();
  // TODO(nlordell): Deal with pagination...
  return results.filter(
    ({ message }) =>
      message.domain.name === "Gnosis Protocol" &&
      message.domain.chainId === chainId.toString() &&
      message.domain.verifyingContract ===
        "0x9008d19f58aabd9ed0d60971565aa8510560ab41" &&
      message.domain.version === "v2"
  );
}
