<script lang="ts">
  import 'carbon-components-svelte/css/g80.css';

  import './styles/global.scss';
  // import './styles/scale.scss';
  // import './styles/scroll.scss';

  import { Router, Route } from 'svelte-routing';

  import Login from './Login.svelte';
  import Home from './Home.svelte';
  import MainQuestions from './MainQuestions.svelte';
  import BonusQuestions from './BonusQuestions.svelte';
  import { upgrade } from './client';
  import EditQuestion from './EditQuestion.svelte';
  import Teams from './Teams.svelte';
  import EditTeam from './EditTeam.svelte';

  export let url;
  let isLoaded = false;

  // new ResizeObserver(([event]) => {
  //   document.documentElement.style.setProperty('--page-width', `${event.contentRect.width}`);
  // }).observe(document.documentElement);

  async function load() {
    await upgrade();
    isLoaded = true;
  }

  void load();
</script>

{#if isLoaded}
  <div class="content">
    <Router {url}>
      <main>
        <Route path="/admin/login" component={Login} />
        <Route path="/admin" component={Home} />

        <Route path="/admin/main-questions" component={MainQuestions} />
        <Route path="/admin/bonus-questions" component={BonusQuestions} />

        <Route path="/admin/teams" component={Teams} />

        <Route path="/admin/question/edit/:id" let:params>
          <EditQuestion questionId={params.id} />
        </Route>

        <Route path="/admin/team/edit/:id" let:params>
          <EditTeam teamId={params.id} />
        </Route>

        <Route>
          <p>PAGE NOT FOUND</p>
        </Route>
      </main>
    </Router>
  </div>
{/if}

<style>
  .content {
    padding: 24px;
  }
</style>
