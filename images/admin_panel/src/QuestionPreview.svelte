<script lang="ts">
  import type { AdminQuestion } from 'game-socket/dist/trivia/admin_state';
  import { navigate } from 'svelte-routing';
  import DeleteModal from './DeleteModal.svelte';
  import Entry, { type EntryMenuItem } from './Entry.svelte';
  import MoveModal from './MoveModal.svelte';

  export let question: AdminQuestion;
  export let index: number;
  export let track: 'main' | 'bonus';

  let isMoving = false;
  let isDeleting = false;

  $: imageText = question.image ? 'Image Question' : undefined;
  $: frameText = question.frame ? 'Frame Question' : undefined;

  $: questionText = question.name ?? question.title ?? question.text ?? imageText ?? frameText ?? 'Empty Question';

  $: options = [
    {
      text: 'Guess Feed',
      action: () => {
        navigate(`/question/feed/${question._id}`);
      },
    },
    {
      text: 'Move',
      action: () => {
        isMoving = true;
      },
    },
    {
      text: 'Edit',
      action: () => {
        navigate(`/question/edit/${question._id}`);
      },
    },
    {
      text: 'Delete',
      action: () => {
        isDeleting = true;
      },
    },
  ] as EntryMenuItem[];
</script>

<div>
  <Entry handle={`${index + 1}`} content={questionText} {options} />
  {#if isMoving}
    <MoveModal
      questionId={question._id}
      {track}
      on:close={() => {
        isMoving = false;
      }}
    />
  {/if}
  {#if isDeleting}
    <DeleteModal
      documentId={question._id}
      kind="question"
      on:close={() => {
        isDeleting = false;
      }}
    />
  {/if}
</div>
