<script lang="ts">
  import QuestionPreview from './QuestionPreview.svelte';
  import type { AdminQuestion } from 'game-socket/dist/trivia/admin_state.js';
  import { derived } from 'svelte/store';
  import { client, order } from './client';
  import { Button } from 'carbon-components-svelte';
  import { setQuestionOrder, upsertQuestion } from 'game-socket/dist/trivia/admin_rpcs';

  export let track: 'main' | 'bonus';

  const questions = derived([client, order], ([{ questions }, order]) => {
    return order[track].map(id => questions.entities[id]);
  });

  async function addQuestion() {
    const { questionId } = await client.call(upsertQuestion, { answer: '' });
    const newOrder = { ...$order };
    newOrder[track] = [...newOrder[track], questionId];
    await client.call(setQuestionOrder, newOrder);
  }
</script>

<div class="question-list">
  {#each $questions as question, index}
    <QuestionPreview {question} {index} {track} />
  {/each}
  <Button kind="secondary" on:click={addQuestion}>Add Question</Button>
</div>

<style lang="scss">
  .question-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin: 24px 0;
  }
</style>
