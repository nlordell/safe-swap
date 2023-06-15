<script>
  import { ethers } from "ethers";
  import { debounce } from "lodash-es";

  import { getLimitQuote } from "../api/cow.js";
  import { tokens } from "../data/tokenlist.json";

  export let account;
  export let onSwap;

  let sellToken = ethers.constants.AddressZero;
  let buyToken = ethers.constants.AddressZero;
  let sellAmount = "0";
  let receiver = ethers.constants.AddressZero;

  let quote = null;
  $: {
    quote = null;
    getQuote({ sellToken, buyToken, sellAmount, receiver });
  };

  let buyAmount = "...";
  let doSwap = null;
  $: {
    if (quote?.estimatedBuyAmount !== undefined) {
      buyAmount = `~${formatUnits(buyToken, quote.estimatedBuyAmount)}`;
      doSwap = () => onSwap(quote);
    } else {
      buyAmount = quote?.error ?? "...";
      doSwap = null;
    }
  };

  const getQuote = debounce(
    async ({ sellToken, buyToken, sellAmount, receiver }) => {
      try{
        quote = await getLimitQuote({
          from: account.address,
          chainId: account.chainId,
          sellToken,
          buyToken,
          sellAmount: parseUnits(sellToken, sellAmount),
          receiver,
         });
      } catch (err) {
        console.warn(err);
        quote = { error: err.message };
      }
    },
    500,
  );

  function tokenDecimals(token) {
    const a = ethers.utils.getAddress
    const decimals = tokens.find(({ address }) => a(address) == a(token))?.decimals;
    return typeof decimals === "number"
      ? decimals
      : null;
  }

  function parseUnits(token, amount) {
    const decimals = tokenDecimals(token);
    if (decimals === null) {
      return BigInt(amount);
    }
    const atoms = ethers.utils.parseUnits(`${amount}`, decimals);
    return BigInt(`${atoms}`);
  }

  function formatUnits(token, amount) {
    const decimals = tokenDecimals(token);
    if (decimals === null) {
      return `${amount}`;
    }
    return ethers.utils.formatUnits(`${amount}`, decimals);
  }
</script>

<style>
  div.group {
    margin-bottom: 0.2rem;
  }

	label {
    display: inline-block;
		width: 6rem;
	}

  input {
    font-family: monospace;
    display: inline-block;
    box-sizing: border-box;
    height: 1.75rem;
    width: 24rem;
    vertical-align: middle;
  }

  div.actions {
    margin-top: 1rem;
    box-sizing: border-box;
    width: 30.25rem;
  }

  button {
    float: right;
    margin-left: 1rem;
    height: 1.75rem;
    width: 6.4rem;
  }
</style>

<form>
  <div class="group">
    <label for="sellToken">Sell Token</label>
    <input type="text" id="sellToken" list="tokens" bind:value={sellToken}>
  </div>

  <div class="group">
    <label for="sellAmount">Sell Amount</label>
    <input type="text" id="sellAmount" bind:value={sellAmount}>
  </div>

  <div class="group">
    <label for="buyToken">Buy Token</label>
    <input type="text" id="buyToken" list="tokens" bind:value={buyToken}>
  </div>

  <div class="group">
    <label for="buyAmount">Buy Amount</label>
    <input type="text" id="buyAmount" value={buyAmount} disabled=true>
  </div>

  <div class="group">
    <label for="receiver">Receiver</label>
    <input type="text" id="receiver" bind:value={receiver}>
  </div>

  <div class="actions">
    <button type="button" on:click={doSwap} disabled={doSwap === null}>Swap</button>
  </div>

  <datalist id="tokens">
    {#each tokens as token}
      {#if token.chainId === account.chainId}
        <option value={token.address}>{token.name} ({token.symbol})</option>
      {/if}
	  {/each}
  </datalist>
</form>
