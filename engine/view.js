import { PERSONAL_ITEMS } from './data.js';
import { clone, cutBlueCount, lockedValues } from './helpers.js';

function tokenSummary(state, wire) {
  return wire.info.map((id) => {
    const token = state.tokens.find((candidate) => candidate.id === id);
    return token
      ? { id: token.id, kind: token.kind, value: token.value, improvised: Boolean(token.improvised) }
      : null;
  }).filter(Boolean);
}

function wireView(state, wire, mine) {
  const info = tokenSummary(state, wire);
  if (mine) {
    return {
      id: wire.id,
      stand: wire.stand,
      kind: wire.kind,
      value: wire.value,
      order: wire.order,
      cut: wire.cut,
      revealed: wire.revealed,
      info,
    };
  }

  if (wire.cut || wire.revealed) {
    return {
      id: wire.id,
      stand: wire.stand,
      kind: wire.kind,
      value: wire.value,
      order: wire.order,
      cut: wire.cut,
      revealed: wire.revealed,
      hidden: false,
      info,
    };
  }

  const numberToken = info.find((token) => token.kind === 'number');
  if (numberToken) {
    return {
      id: wire.id,
      stand: wire.stand,
      kind: 'blue',
      value: numberToken.value,
      hidden: false,
      knownByToken: true,
      info,
    };
  }
  const yellowToken = info.find((token) => token.kind === 'yellow');
  if (yellowToken) {
    return {
      id: wire.id,
      stand: wire.stand,
      kind: 'yellow',
      value: null,
      hidden: false,
      knownByToken: true,
      info,
    };
  }

  // Hidden wires must not carry a value, an order, or a kind.
  return {
    id: wire.id,
    stand: wire.stand,
    hidden: true,
    cut: false,
    revealed: false,
    info,
  };
}

export function publicView(state, viewerId) {
  const viewer = state.players.findIndex((player) => player.id === viewerId);

  // The wire list behind a pending decision exposes which of the pointed wires
  // matched (or which of them were red), so it is shown to its actor only.
  let pending = null;
  if (state.pending) {
    const actor = state.players[state.pending.actor].id;
    const mine = viewer >= 0 && viewer === state.pending.actor;
    pending = {
      kind: state.pending.kind,
      actorId: actor,
      ...(state.pending.kind === 'walkieReturn'
        ? { sourceWireId: state.pending.sourceWireId }
        : {}),
      ...(mine && (state.pending.kind === 'chooseCut' || state.pending.kind === 'placeToken')
        ? { candidates: clone(state.pending.candidates) }
        : {}),
    };
  }

  return {
    schema: state.schema,
    gameId: state.gameId,
    missionId: state.missionId,
    mission: clone(state.mission),
    phase: state.phase,
    you: viewer >= 0 ? state.players[viewer].id : null,
    playerCount: state.playerCount,
    captainId: state.players[state.captainIndex].id,
    activeId: state.players[state.activeIndex].id,
    setupSeatId: state.phase === 'setup' && state.setupSeat !== null
      ? state.players[state.setupSeat].id
      : null,
    turnNumber: state.turnNumber,
    dial: clone(state.dial),
    markers: clone(state.markers),
    sequence: state.sequence
      ? {
        cards: state.sequence.cards.slice(),
        required: state.sequence.required,
        locked: lockedValues(state),
        cut: state.sequence.cards.map((value) => cutBlueCount(state, value)),
      }
      : null,
    equipment: state.equipment.map((card) => ({
      number: card.number,
      id: card.id,
      name: card.name,
      timing: card.timing,
      effect: card.effect,
      text: card.text,
      usable: card.usable,
      used: card.used,
    })),
    validation: state.validation.slice(),
    infoSupply: clone(state.infoSupply),
    tokens: state.tokens.map((token) => ({
      id: token.id,
      kind: token.kind,
      value: token.value,
      wireId: token.wireId,
      owner: state.players[token.owner].id,
      improvised: Boolean(token.improvised),
    })),
    labels: clone(state.labels),
    players: state.players.map((player, seat) => ({
      id: player.id,
      name: player.name,
      seat: player.seat,
      standCount: player.standCount,
      characterId: player.characterId,
      connected: player.connected,
      personal: {
        id: player.personal.id,
        name: PERSONAL_ITEMS[player.personal.id]?.name || player.personal.id,
        used: player.personal.used,
      },
      hands: state.stands[seat].map((ids, stand) => ids.map(
        (id) => wireView(state, state.wires[id], seat === viewer),
      )),
    })),
    pending,
    lossReason: state.lossReason,
    result: state.phase === 'won' || state.phase === 'lost'
      ? { phase: state.phase, lossReason: state.lossReason }
      : null,
    log: clone(state.log),
  };
}
