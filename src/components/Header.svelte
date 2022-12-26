<script>
  import { prefixedAddress } from "../api/chain.js";
  
  export let account;
  console.log(account);

  let address = account ? prefixedAddress(account) : null;
</script>

<style>
  div {
    margin-bottom: 2.5rem;
  }

  .address {
    font-family: monospace;
  }
</style>

<div>
  {#if address !== null}
    <span class="address">{address}</span>
  {:else}
    <splan>Connecting...</splan>
  {/if}
</div>
