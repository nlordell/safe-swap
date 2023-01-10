<script>
  import { onMount, onDestroy } from "svelte";

  import { orderFromPayload, placeOrder, orderUrl } from "../api/cow.js";
  import * as safe from "../api/safe.js";

  export let account;

  let entries = [];
  async function updateHistory() {
    const messages = await safe.messages();
    const entries = messages
      .map(({ message, messageHash, preparedSignature }) => {
        const order = orderFromPayload(message);
        return order != null
          ? {
            order: {
              ...order,
              from: account.address,
              signingScheme: "eip1271",
              signature: preparedSignature,
            },
            messageHash,
          }
          : null;
      })
      .filter((entry) => !!entry);

    for (const entry of entries) {
      if (!entry.order.signature) {
        entry.status = "🔏 awaiting confirmations";
        continue;
      }
      try {
        const { status, uid } = await placeOrder(
          account.address,
          account.chainId,
          entry.order,
        );
        entry.status = `🐮 ${status}`;
        entry.link = {
          text: uid.substr(2, 7),
          url: orderUrl(uid),
        };
      } catch (err) {
        console.warn(err);
        entry.status = `❌ ${err.message}`;
      }
    }

    return entries;
  }

  let interval
  onMount(async () => {
    entries = await updateHistory();
    interval = setInterval(async () => {
      entries = await updateHistory();
    }, 10000);
  });
  onDestroy(() => clearInterval(interval));
</script>

<style>
  ul {
    margin-top: 5rem;
  }

  a {
    font-family: monospace;
  }
</style>

<ul>
  {#each entries as entry}
    <li>
      {entry.status}
      {#if entry.link}
        <a href={entry.link.url}>{entry.link.text}</a>
      {/if}
    </li>
  {/each}
</ul>
