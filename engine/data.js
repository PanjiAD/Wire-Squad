import missionsFile from '../data/missions.json' with { type: 'json' };
import equipmentFile from '../data/equipment.json' with { type: 'json' };
import charactersFile from '../data/characters.json' with { type: 'json' };

export const MISSIONS = missionsFile.missions;
export const EQUIPMENT_CARDS = equipmentFile.cards;
export const CHARACTERS = charactersFile.characters;
export const PERSONAL_ITEMS = charactersFile.personalItems;

const missionById = new Map(MISSIONS.map((m) => [m.id, m]));

export function getMission(id) {
  const mission = missionById.get(Number(id));
  if (!mission) throw new Error(`unknown mission: ${id}`);
  return mission;
}

export function getEquipmentCard(number) {
  return EQUIPMENT_CARDS.find((c) => c.number === Number(number)) || null;
}

// Mission setup for a given player count. A two-player box replaces the named
// fields wholesale (it never merges counts).
export function resolveSetup(mission, playerCount) {
  const setup = JSON.parse(JSON.stringify(mission.setup));
  if (playerCount === 2 && mission.twoPlayer) {
    for (const [key, value] of Object.entries(mission.twoPlayer)) {
      setup[key] = JSON.parse(JSON.stringify(value));
    }
  }
  return setup;
}

export function missionSnapshot(mission) {
  return {
    id: mission.id,
    title: mission.title,
    tier: mission.tier,
    lesson: mission.lesson,
    rules: mission.rules.slice(),
    success: mission.success,
    failure: mission.failure,
    unverified: mission.unverified.slice(),
    freeTurns: Boolean(mission.freeTurns),
    timerMinutes: mission.timer ? mission.timer.minutes : null,
  };
}
