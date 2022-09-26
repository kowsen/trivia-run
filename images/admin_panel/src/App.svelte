<script lang="ts">
  import svelteLogo from './assets/svelte.svg'
  import Counter from './lib/Counter.svelte'
  import { GameClient } from 'game-socket/dist/lib/client.js';
  import {upgradeToAdmin, upsertQuestion} from 'game-socket/dist/trivia/admin_rpcs.js';
  import { adminReducer } from 'game-socket/dist/trivia/admin_state.js'
  import { createSlice } from '@reduxjs/toolkit'
  import type { PayloadAction } from '@reduxjs/toolkit'
    import { derived } from 'svelte/store';

  const client = new GameClient("ws://localhost:8082", adminReducer);

  let guess: string = "";
  let result: boolean = false;

  async function sendGuess() {
    const result = await client.call(upsertQuestion, {title: guess, answer: "asdf"});
    console.log(result);
  }

  async function upgrade() {
    const result = await client.call(upgradeToAdmin, {password: "password"});
    console.log(result);
  }

  void upgrade();

  const questionTitles = derived(client, ({questions}) => {
    return questions.ids.map(id => questions.entities[id]).map(question => question.title).join(', ');
  });

  $: testState = JSON.stringify($client);
</script>

<main>
  <div>
    <a href="https://vitejs.dev" target="_blank"> 
      <img src="/vite.svg" class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank"> 
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <h1>Vite + Svelte</h1>

  <div class="card">
    <Counter />
  </div>

  <input type="text" bind:value={guess} />
  <p>Correct: {result}</p>
  <p>LAST: {$questionTitles}</p>
  <button on:click={sendGuess}>Send</button>

  <p>
    Check out <a href="https://github.com/sveltejs/kit#readme" target="_blank">SvelteKit</a>, the official Svelte app framework powered by Vite!
  </p>

  <p class="read-the-docs">
    Click on the Vite and Svelte logos to learn more
  </p>
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>