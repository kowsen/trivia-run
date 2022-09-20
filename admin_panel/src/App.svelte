<script lang="ts">
  import svelteLogo from './assets/svelte.svg'
  import Counter from './lib/Counter.svelte'
  import { GameClient } from 'trivia-ws/dist/client.js';
  import { RPC } from 'trivia-ws/dist/rpc.js';
  import { stringField, booleanField } from 'trivia-ws/dist/validator.js';
  import { createSlice } from '@reduxjs/toolkit'
  import type { PayloadAction } from '@reduxjs/toolkit'

  interface GameState {
    lastGuess: string;
  }

  const initialState: GameState = { lastGuess: "" };

  const guessSlice = createSlice({
    name: 'guess',
    initialState,
    reducers: {
      guess(state, action: PayloadAction<{guess: string}>) {
        state.lastGuess = action.payload.guess
      },
    },
  })

  const client = new GameClient("ws://localhost:8082", guessSlice.reducer);

  const testRpc = new RPC('guess', { value: stringField }, { isCorrect: booleanField });

  let guess: string = "";
  let result: boolean = false;

  async function sendGuess() {
    const response = await client.call(testRpc, {value: guess});
    result = response.isCorrect;
  }
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
  <p>LAST: {($client).lastGuess}</p>
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