import { ethers } from "ethers";

function getNetwork(chainId) {
  switch (chainId) {
    case 1:
      return "mainnet";
    case 5:
      return "goerli";
    case 100:
      return "xdai";
    default:
      throw new Error(`unsupported chain ${chainId}`);
  }
}

const DOMAIN = {
  name: "Gnosis Protocol",
  version: "v2",
  verifyingContract: "0x9008D19f58AAbD9eD0D60971565AA8510560ab41",
};
const ORDER_TYPE = [
  { name: "sellToken", type: "address" },
  { name: "buyToken", type: "address" },
  { name: "receiver", type: "address" },
  { name: "sellAmount", type: "uint256" },
  { name: "buyAmount", type: "uint256" },
  { name: "validTo", type: "uint32" },
  { name: "appData", type: "bytes32" },
  { name: "feeAmount", type: "uint256" },
  { name: "kind", type: "string" },
  { name: "partiallyFillable", type: "bool" },
  { name: "sellTokenBalance", type: "string" },
  { name: "buyTokenBalance", type: "string" },
];

const ONE_DAY = 60 * 60 * 24;

export async function getLimitQuote({
  from,
  chainId,
  sellToken,
  buyToken,
  sellAmount,
}) {
  const network = getNetwork(chainId);
  const response = await fetch(
    `https://api.cow.fi/${network}/api/v1/quote`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: ethers.utils.getAddress(from),
        sellToken: ethers.utils.getAddress(sellToken),
        buyToken: ethers.utils.getAddress(buyToken),
        kind: "sell",
        appData: ethers.utils.id("Safe Swap"),
        sellAmountBeforeFee: `${BigInt(sellAmount)}`,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(parseError(await response.text()));
  }

  const { id, quote } = await response.json();

  // Adjust the final buy amount to:
  // 1. account for some slippage tolerance
  // 2. allow for 2x fees of additional surplus
  const adjustedSellAmount = (BigInt(quote.sellAmount) * 101n / 100n) +
    (BigInt(quote.feeAmount) * 2n);
  const buyAmount = BigInt(quote.buyAmount) * BigInt(quote.sellAmount) /
    adjustedSellAmount;

  delete quote.signingScheme;
  return {
    payload: ethers.utils._TypedDataEncoder.getPayload(
      {
        ...DOMAIN,
        chainId,
      },
      {
        Order: ORDER_TYPE,
      },
      {
        sellToken: quote.sellToken,
        buyToken: quote.buyToken,
        receiver: ethers.constants.AddressZero,
        sellAmount: `${BigInt(sellAmount)}`,
        buyAmount: `${buyAmount}`,
        validTo: ~~(Date.now() / 1000) + ONE_DAY,
        appData: quote.appData,
        feeAmount: "0",
        kind: quote.kind,
        partiallyFillable: quote.partiallyFillable,
        sellTokenBalance: quote.sellTokenBalance,
        buyTokenBalance: quote.buyTokenBalance,
      },
    ),
    quoteId: id,
    estimatedBuyAmount: quote.buyAmount,
    estimatedFeeAmount: quote.feeAmount,
  };
}

function isOrderPayload({ domain, types, primaryType }) {
  return primaryType === "Order" &&
    types.Order?.length === ORDER_TYPE.length &&
    domain.name === DOMAIN.name &&
    domain.version === DOMAIN.version &&
    ethers.utils.getAddress(domain.verifyingContract) === DOMAIN.verifyingContract &&
    ORDER_TYPE.every(({ name, type }, i) => {
      const field = types.Order[i];
      return name === field.name && type === field.type;
    });
}

export function orderFromPayload({ domain, types, primaryType, message }) {
  if (!isOrderPayload({ domain, types, primaryType })) {
    return null;
  }

  let validTo;
  try {
    validTo = parseInt(`${message.validTo}`);
  } catch (err) {
    console.warn(err);
    return null;
  }

  return { ...message, validTo };
}

async function getOrder(chainId, uid) {
  const network = await getNetwork(chainId);
  const response = await fetch(
    `https://api.cow.fi/${network}/api/v1/orders/${uid}`,
  );
  if (!response.ok) {
    throw new Error(parseError(await response.text()));
  }

  const order = await response.json();
  return order;
}

export async function placeOrder(from, chainId, order) {
  try {
    const hash = ethers.utils._TypedDataEncoder.hash(
      {
        ...DOMAIN,
        chainId,
      },
      {
        Order: ORDER_TYPE,
      },
      order,
    );
    const uid = ethers.utils.solidityPack(
      ["bytes32", "address", "uint32"],
      [hash, from, order.validTo],
    );

    return await getOrder(chainId, uid);
  } catch {
    // order isn't created, so try to create it now.
  }

  const network = getNetwork(chainId);
  const response = await fetch(
    `https://api.cow.fi/${network}/api/v1/orders`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: ethers.utils.getAddress(from),
        ...order,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(parseError(await response.text()));
  }

  const uid = await response.json();
  return await getOrder(chainId, uid);
}

export function orderUrl(uid) {
  return `https://explorer.cow.fi/orders/${uid}`;
}

function parseError(text) {
  try {
    const { description } = JSON.parse(text);
    return description ?? text;
  } catch {
    return text;
  }
}
