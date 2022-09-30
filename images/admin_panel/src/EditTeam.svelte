<script lang="ts">
  import { TextInput, TextArea, Button, NumberInput, Checkbox, Select, SelectItem } from 'carbon-components-svelte';
  import { upsertQuestion, upsertTeam } from 'game-socket/dist/trivia/admin_rpcs';
  import type { AdminQuestion } from 'game-socket/dist/trivia/admin_state';
  import { navigate } from 'svelte-routing';
  import { derived } from 'svelte/store';
  import AnswerTester from './AnswerTester.svelte';
  import { client, order } from './client';
  import FileField from './FileField.svelte';
  import Header from './Header.svelte';

  export let teamId: string;

  const questions = derived([client, order], ([{ questions }, order]) => {
    return order.main.map(id => questions.entities[id]);
  });

  $: team = $client.teams.entities[teamId];

  let name: string = '';
  let mainQuestionId: string = '';
  let completedBonusQuestions: string[] = [];
  let isSecretTeam: boolean = false;

  let lastTeam: unknown;
  $: {
    if (team !== lastTeam) {
      name = team.name;
      mainQuestionId = team.mainQuestionId;
      completedBonusQuestions = team.completedBonusQuestions;
      isSecretTeam = team.isSecretTeam;
      lastTeam = team;
    }
  }

  $: generatedTeam = {
    ...team,
    name,
    mainQuestionId,
    completedBonusQuestions,
    isSecretTeam,
  };

  function getQuestionText(question: AdminQuestion): string {
    const imageText = question.image ? 'Image Question' : undefined;
    const frameText = question.frame ? 'Frame Question' : undefined;
    return question.name ?? question.title ?? question.text ?? imageText ?? frameText ?? 'Empty Question';
  }

  $: completedBonusQuestionObjects = completedBonusQuestions
    .map(id => $client.questions.entities[id])
    .filter(question => !!question);

  async function submit() {
    await client.call(upsertTeam, generatedTeam);
    navigate('/admin/teams');
  }
</script>

<Header to="/admin/teams">Edit Team</Header>

<div class="edit-form">
  <p>Token: {team.token}</p>

  <TextInput labelText="Name" placeholder="Enter Name..." helperText="The team's display name." bind:value={name} />

  <Select labelText="Current Question" bind:selected={mainQuestionId}>
    {#each $questions as question, index}
      <SelectItem value={question._id} text={`${index + 1}. ${getQuestionText(question)}`} />
    {/each}
  </Select>

  <Checkbox labelText="Secret Team?" bind:checked={isSecretTeam} />

  {#if completedBonusQuestions.length > 0}
    <div class="completed-bonus">
      <p class="accent">Completed Bonus Questions: (click to delete)</p>
      {#each completedBonusQuestionObjects as question}
        <div class="bonus-item">
          <Button
            size="small"
            kind="secondary"
            on:click={() => {
              completedBonusQuestions = completedBonusQuestions.filter(x => x !== question._id);
            }}>{getQuestionText(question)}</Button
          >
        </div>
      {/each}
    </div>
  {/if}

  <Button kind="secondary" on:click={submit}>Submit</Button>
</div>

<style>
  .edit-form {
    display: flex;
    flex-direction: column;
    margin: 24px 0;
    gap: 24px;
  }

  .completed-bonus {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .bonus-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: 12px;
  }
</style>
