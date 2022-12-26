import { ethers } from "ethers";

function getNetwork(chainId) {
  switch (chainId) {
    case 1:
      return "eth";
    case 5:
      return "gor";
    case 100:
      return "gno";
    default:
      throw new Error(`unsupported chain ${chainId}`);
  }
}

export function prefixedAddress({ chainId, address }) {
  return `${getNetwork(chainId)}:${ethers.utils.getAddress(address)}`;
}
