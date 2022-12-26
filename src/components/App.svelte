<script>
  import { onMount } from "svelte";

  import Header from "./Header.svelte";
  import History from "./History.svelte";
  import Order from "./Order.svelte";
  import * as safe from "../api/safe.js";
  
  let account;

  onMount(async () => {
    account = await safe.getInfo();
  });

  async function onSwap({ payload }) {
    await safe.signTypedData(payload);
  }
</script>

<style>
  div {
    padding: 1rem 3rem;
  }
</style>

<div>
  {#key account}
    <Header {account} />
  {/key}
  {#if account}
    <Order {account} {onSwap}/>
    <History {account}/>
  {/if}
</div>
