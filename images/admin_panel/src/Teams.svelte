<script lang="ts">
  import QuestionPreview from './QuestionPreview.svelte';
  import type { AdminQuestion, AdminTeam } from 'game-socket/dist/trivia/admin_state.js';
  import { derived } from 'svelte/store';
  import { client, order } from './client';
  import { Button } from 'carbon-components-svelte';
  import { setQuestionOrder, upsertQuestion, upsertTeam } from 'game-socket/dist/trivia/admin_rpcs';
  import Header from './Header.svelte';
  import { generateToken } from 'game-socket/dist/trivia/base';
  import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
  import TeamPreview from './TeamPreview.svelte';

  const teams = derived([client, order], ([{ teams }, order]) => {
    const teamList = teams.ids.map(id => teams.entities[id]).filter(team => !team._deleted);
    teamList.sort((a, b) => {
      if (a.mainQuestionId === b.mainQuestionId) {
        return (a.lastAnswerTime ?? 0) - (b.lastAnswerTime ?? 0);
      }
      return (order.main.indexOf(b.mainQuestionId) ?? -1) - (order.main.indexOf(a.mainQuestionId) ?? -1);
    });
    return teamList;
  });

  async function addTeam() {
    await client.call(upsertTeam, {
      name: uniqueNamesGenerator({ dictionaries: [adjectives, animals], length: 2, separator: ' ' }),
      token: generateToken(6),
      completedBonusQuestions: [],
      mainQuestionId: $order.main[0],
    });
  }
</script>

<div class="teams">
  <Header>Teams</Header>
  <div class="team-list">
    {#each $teams as team}
      <TeamPreview {team} />
    {/each}
    <Button kind="secondary" on:click={addTeam}>Add Team</Button>
  </div>
</div>

<style lang="scss">
  .team-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin: 24px 0;
  }
</style>
