<script lang="ts">
  import { setQuestionOrder } from 'game-socket/dist/trivia/admin_rpcs.js';
  import { derived } from 'svelte/store';
  import QuestionList from './QuestionList.svelte';
  import { client, upgrade } from './client';

  async function sendGuess() {
    const result = await client.call(setQuestionOrder, {
      main: [...$order.main].reverse() as string[],
      bonus: [],
    });
    console.log(result);
  }

  const order = derived(client, ({ order }) => {
    const docs = order.ids.map(id => order.entities[id]);
    return docs.sort((a, b) => b._modified - a._modified)[0] ?? { main: [], bonus: [] };
  });

  const mainQuestions = derived([client, order], ([{ questions }, order]) => {
    return order.main.map(id => questions.entities[id]);
  });
</script>

<main>
  <QuestionList questions={$mainQuestions} />

  <button on:click={sendGuess}>Send</button>
</main>
