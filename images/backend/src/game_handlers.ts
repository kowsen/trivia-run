const BASE_FILTER = { _deleted: { $ne: true } };

export const GAME_ROOM = 'GAME';

export function getTeamRoom(teamId: string): string {
  return `TEAM_${teamId}`;
}

export function getGameQuestionRoom(questionId: string): string {
  return `QUESTION_${questionId}`;
}
