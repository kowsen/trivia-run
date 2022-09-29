<script lang="ts">
  import type { AdminQuestion, AdminTeam } from 'game-socket/dist/trivia/admin_state';
  import { navigate } from 'svelte-routing';
  import DeleteModal from './DeleteModal.svelte';
  import Entry, { type EntryMenuItem } from './Entry.svelte';
  import MoveModal from './MoveModal.svelte';
  import { order } from './client';

  export let team: AdminTeam;

  let isDeleting = false;

  $: options = [
    {
      text: 'Guess Feed',
      action: () => {
        navigate(`/team/feed/${team._id}`);
      },
    },
    {
      text: 'Edit',
      action: () => {
        navigate(`/team/edit/${team._id}`);
      },
    },
    {
      text: 'Delete',
      action: () => {
        isDeleting = true;
      },
    },
  ] as EntryMenuItem[];

  $: questionIndex = $order.main.indexOf(team.mainQuestionId);
</script>

<div>
  <Entry
    handle={`q${questionIndex + 1}`}
    content={`${team.name}${team.isSecretTeam ? ' (secret)' : ''}`}
    {options}
    isSecret={team.isSecretTeam}
  />
  {#if isDeleting}
    <DeleteModal
      documentId={team._id}
      kind="team"
      on:close={() => {
        isDeleting = false;
      }}
    />
  {/if}
</div>
