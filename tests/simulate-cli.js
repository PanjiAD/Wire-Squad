// Batch simulator: node tests/simulate-cli.js [gamesPerConfig] [seed] [--oracle]
// Prints a table of outcomes per mission and player count and exits non-zero
// if any game deadlocks, breaks an invariant, or fails to terminate.
//
//   --oracle  play with the perfect-match policy instead of random moves, to
//             show how often a perfect-information player can finish a mission.

import { newGame } from '../engine/index.js';
import { simulate, makeChooser, makeOracle } from './sim.js';

const oracle = process.argv.includes('--oracle');
const numeric = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const gamesPerConfig = Number(numeric[0] || 25);
const baseSeed = Number(numeric[1] || 1);
const missions = [1, 2, 3, 4, 5, 6, 7, 8];
const counts = [2, 3, 4, 5];

let games = 0;
let won = 0;
let lostRed = 0;
let lostDial = 0;
let totalSteps = 0;
let maxSteps = 0;
let failures = 0;

console.log('mission players  games   won  red  dial  avgSteps');
console.log('------------------------------------------------');

for (const missionId of missions) {
  for (const players of counts) {
    let localWon = 0;
    let localRed = 0;
    let localDial = 0;
    let localSteps = 0;
    for (let game = 0; game < gamesPerConfig; game += 1) {
      const seed = baseSeed + game * 7919 + missionId * 101 + players;
      try {
        const state = newGame({ missionId, players, seed });
        const result = simulate(state, {
          chooser: oracle ? makeOracle() : makeChooser(seed ^ 0x5f3759df),
          maxSteps: 5000,
        });
        games += 1;
        localSteps += result.steps;
        totalSteps += result.steps;
        maxSteps = Math.max(maxSteps, result.steps);
        if (result.state.phase === 'won') {
          won += 1;
          localWon += 1;
        } else if (result.state.lossReason === 'red') {
          lostRed += 1;
          localRed += 1;
        } else {
          lostDial += 1;
          localDial += 1;
        }
      } catch (error) {
        failures += 1;
        console.error(`FAIL mission ${missionId} players ${players} seed ${seed}: ${error.message}`);
      }
    }
    const shown = Math.min(gamesPerConfig, games);
    const avg = gamesPerConfig > 0 ? (localSteps / gamesPerConfig).toFixed(1) : '0';
    console.log(
      `${String(missionId).padStart(7)} ${String(players).padStart(7)} `
      + `${String(gamesPerConfig).padStart(6)} ${String(localWon).padStart(5)} `
      + `${String(localRed).padStart(4)} ${String(localDial).padStart(5)} `
      + `${String(avg).padStart(9)}`,
    );
    void shown;
  }
}

console.log('------------------------------------------------');
console.log(`games ${games}  won ${won}  red ${lostRed}  dial ${lostDial}`);
console.log(`average steps ${(totalSteps / Math.max(1, games)).toFixed(1)}  longest ${maxSteps}`);
console.log(`failures ${failures}`);

if (failures > 0) process.exitCode = 1;
